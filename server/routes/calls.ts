import { Router, Response } from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { readDB, writeDB } from "../utils/fileLock";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { saveAudioFromBase64 } from "../services/audio.service";
import { sendSuccess, sendError } from "../utils/response";

const router = Router();
const RECORDINGS_DIR = path.join(process.cwd(), "recordings");

// Initialize Gemini Client
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// GET /api/calls
router.get("/", authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const db = readDB();
  const user = req.user!;
  const currentTenantId = req.tenantId || "t-default";

  // Filter callLogs to the active tenant first
  const tenantCallLogs = db.callLogs.filter((c: any) => c.tenantId === currentTenantId);

  if (user.role === "telecaller") {
    // Isolated calling sessions under the active tenant
    const filtered = tenantCallLogs.filter((c: any) => c.telecallerId === user.id);
    return res.json(filtered);
  }

  res.json(tenantCallLogs);
});

// POST /api/calls/save
router.post("/save", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { leadId, telecallerId, status, duration, notes, recordingBase64, dealValue } = req.body;
  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const currentCompanyId = req.companyId || "c-default";

  const lead = db.leads.find((l: any) => l.id === leadId && l.tenantId === currentTenantId);
  const telecaller = db.users.find((u: any) => u.id === (telecallerId || req.user?.id) && u.tenantId === currentTenantId);

  if (!lead) {
    return res.status(404).json({ error: "Lead not found in tenant" });
  }

  const callId = "call-" + Date.now();
  let hasRecording = false;
  let customRecordingId = "";
  const savedMimeType = "audio/mpeg";

  if (recordingBase64) {
    try {
      const telecallerName = telecaller ? telecaller.name : "Telecaller";
      const leadName = lead.name;
      
      // Save using non-blocking async conversion from audio service
      const audioResult = await saveAudioFromBase64(recordingBase64, telecallerName, leadName);
      customRecordingId = audioResult.customRecordingId;
      hasRecording = true;
    } catch (err) {
      console.error("Failed to schedule background audio recording conversion", err);
    }
  }

  // Save the call log
  const newLog = {
    id: callId,
    leadId,
    leadName: lead.name,
    leadPhone: lead.phone,
    telecallerId: telecaller ? telecaller.id : "unknown",
    telecallerName: telecaller ? telecaller.name : "Unknown",
    status,
    duration: Number(duration) || 0,
    timestamp: new Date().toISOString(),
    notes: notes || "",
    hasRecording,
    recordingId: hasRecording ? customRecordingId : undefined,
    recordingMimeType: hasRecording ? savedMimeType : undefined,
    dealValue: Number(dealValue) || 0,
    feedbackTarget: "telecaller", // Default target for admin feedback
    feedbackReplies: [], // Replies from telecallers or sub-admins or heads
    tenantId: currentTenantId,
    companyId: currentCompanyId
  };

  db.callLogs.push(newLog);

  // Update lead status
  lead.status = status;
  if (dealValue !== undefined) {
    lead.dealValue = Number(dealValue) || 0;
  }
  lead.lastCalled = newLog.timestamp;
  if (notes) {
    lead.notes = notes;
  }

  // Update journey
  if (!lead.journey) lead.journey = [];
  lead.journey.push({
    status,
    notes: notes ? `Call Connected: "${notes}" (Duration: ${duration}s)` : `Call Connected (Duration: ${duration}s)`,
    updatedBy: telecaller ? telecaller.name : "Telecaller",
    timestamp: new Date().toISOString()
  });

  await writeDB(db);
  res.json({ success: true, callLog: newLog, lead });
});

// POST /api/calls/update
router.post("/update", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { callId, status, notes, dealValue } = req.body;
  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";

  const log = db.callLogs.find((l: any) => l.id === callId && l.tenantId === currentTenantId);
  if (!log) {
    return res.status(404).json({ error: "Call log not found in tenant" });
  }

  if (status) {
    log.status = status;
  }
  if (notes) {
    log.notes = notes;
  }
  if (dealValue !== undefined) {
    log.dealValue = Number(dealValue) || 0;
  }

  await writeDB(db);
  res.json({ success: true, callLog: log });
});

// GET /api/calls/recording/:filename
router.get("/recording/:filename", authenticateUser, (req: AuthenticatedRequest, res: Response) => {
  const filename = req.params.filename;
  if (!filename) {
    return res.status(400).json({ error: "Filename is required" });
  }

  // Prevent path traversal
  const sanitizedFilename = path.basename(filename);
  if (sanitizedFilename !== filename) {
    return res.status(400).json({ error: "Invalid filename format" });
  }

  let file = path.join(RECORDINGS_DIR, sanitizedFilename);
  let responseMimeType = "";

  if (sanitizedFilename.endsWith(".mp3")) {
    responseMimeType = "audio/mpeg";
  } else if (sanitizedFilename.endsWith(".webm")) {
    responseMimeType = "audio/webm";
  }

  // Fallback to scan directory if still not found
  if (!fs.existsSync(file)) {
    try {
      const files = fs.readdirSync(RECORDINGS_DIR);
      const matched = files.find(f => f.includes(sanitizedFilename));
      if (matched) {
        file = path.join(RECORDINGS_DIR, matched);
      }
    } catch (e) {}
  }

  if (fs.existsSync(file)) {
    if (responseMimeType) {
      res.setHeader("Content-Type", responseMimeType);
    } else {
      if (file.endsWith(".mp3")) {
        res.setHeader("Content-Type", "audio/mpeg");
      } else if (file.endsWith(".webm")) {
        res.setHeader("Content-Type", "audio/webm");
      } else {
        res.setHeader("Content-Type", "audio/mpeg");
      }
    }
    return res.sendFile(file);
  }
  res.status(404).json({ error: "Recording file not found" });
});

// POST /api/gemini/simulate-call (also route mounted as /api/gemini/simulate-call)
router.post("/simulate-call", async (req, res) => {
  const { leadName, leadRequirements, currentPitch, chatHistory } = req.body;

  if (!aiClient) {
    return res.json({
      reply: `[Simulated Response] Hi, this is ${leadName || "Customer"}. I am interested, but can you please mail me the pricing catalog and call me back tomorrow? Thank you!`
    });
  }

  try {
    const formattedHistory = (chatHistory || []).map((msg: any) => 
      `${msg.role === "user" ? "Telecaller (You)" : leadName}: ${msg.text}`
    ).join("\n");

    const systemPrompt = `You are a potential client named ${leadName || "Customer"}. 
The telecaller is pitching a product/service to you.
Your profile/needs are: "${leadRequirements || "Looking for reliable agency services"}".
Behave like a realistic Indian business owner/client. Speak naturally, a mix of Hindi and English (Hinglish). 
Your responses should be brief, standard phone conversational dialogues (1-3 sentences maximum). 
Respond in character, do not break character. Do not reply as an assistant. Respond directly to the telecaller's pitch.`;

    const prompt = `Here is the current conversation history so far:
${formattedHistory}

Telecaller pitch just now: "${currentPitch}"

Respond back as ${leadName || "Customer"} on the phone:`;

    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemPrompt
      }
    });

    res.json({ reply: response.text });
  } catch (err: any) {
    console.error("Gemini API simulation error:", err);
    res.json({
      reply: `[Simulated Response] Hi, this is ${leadName || "Customer"}. Sounds interesting! Could you share some details over email or WhatsApp?`
    });
  }
});

// POST /api/calls/feedback
router.post("/feedback", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  if (user.role !== "admin" && user.role !== "sub-admin") {
    return res.status(403).json({ error: "Access Denied" });
  }

  const { callId, feedback, target } = req.body;
  if (!callId) {
    return res.status(400).json({ error: "Call ID is required" });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const callLog = db.callLogs.find((c: any) => c.id === callId && c.tenantId === currentTenantId);
  if (callLog) {
    callLog.adminFeedback = feedback;
    callLog.feedbackTarget = target || "telecaller"; // telecaller, head, sub-admin
    await writeDB(db);
    return res.json({ success: true, message: "Admin feedback saved successfully.", callLog });
  }
  res.status(404).json({ error: "Call log not found" });
});

// POST /api/calls/reply
router.post("/reply", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const { callId, text } = req.body;
  const user = req.user!;

  if (!callId || !text) {
    return res.status(400).json({ error: "Call ID and reply text are required" });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";
  const callLog = db.callLogs.find((c: any) => c.id === callId && c.tenantId === currentTenantId);
  if (!callLog) {
    return res.status(404).json({ error: "Call log not found" });
  }

  if (!callLog.feedbackReplies) {
    callLog.feedbackReplies = [];
  }

  callLog.feedbackReplies.push({
    senderName: user.name,
    senderRole: user.role,
    text,
    timestamp: new Date().toISOString()
  });

  await writeDB(db);
  res.json({ success: true, callLog });
});

// POST /api/calls/delete - ONLY MAIN ADMIN HAS RIGHTS
router.post("/delete", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const currentTenantId = req.tenantId || "t-default";

  if (user.id !== "u-admin") {
    return res.status(403).json({ error: "Access Denied: Only the Main Administrator ('u-admin') holds reserved rights to delete call logs. (केवल मुख्य एडमिन ही कॉल लॉग हटा सकते हैं।)" });
  }

  const { callId } = req.body;
  if (!callId) {
    return res.status(400).json({ error: "Call ID is required" });
  }

  const db = readDB();
  const idx = db.callLogs.findIndex((c: any) => c.id === callId && c.tenantId === currentTenantId);
  if (idx !== -1) {
    const callLog = db.callLogs[idx];
    if (callLog.recordingId) {
      let file = path.join(RECORDINGS_DIR, callLog.recordingId);
      if (!fs.existsSync(file)) {
        file = path.join(RECORDINGS_DIR, `${callLog.recordingId}.webm`);
      }
      if (!fs.existsSync(file)) {
        file = path.join(RECORDINGS_DIR, `${callLog.recordingId}.mp3`);
      }
      if (fs.existsSync(file)) {
        try { fs.unlinkSync(file); } catch(e) {}
      }
    }
    db.callLogs.splice(idx, 1);
    await writeDB(db);
    return res.json({ success: true, message: "Recorded call log successfully deleted." });
  }
  res.status(404).json({ error: "Call log not found" });
});

// POST /api/calls/delete-all - ONLY MAIN ADMIN HAS RIGHTS
router.post("/delete-all", authenticateUser, async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const currentTenantId = req.tenantId || "t-default";

  if (user.id !== "u-admin") {
    return res.status(403).json({ error: "Access Denied: Only the Main Administrator ('u-admin') holds reserved rights to delete all call logs." });
  }

  const db = readDB();
  const tenantCallLogs = db.callLogs.filter((c: any) => c.tenantId === currentTenantId);
  
  // Clear physical audio recordings in local directory belonging to current tenant
  if (fs.existsSync(RECORDINGS_DIR)) {
    for (const callLog of tenantCallLogs) {
      if (callLog.recordingId) {
        let file = path.join(RECORDINGS_DIR, callLog.recordingId);
        if (!fs.existsSync(file)) {
          file = path.join(RECORDINGS_DIR, `${callLog.recordingId}.webm`);
        }
        if (!fs.existsSync(file)) {
          file = path.join(RECORDINGS_DIR, `${callLog.recordingId}.mp3`);
        }
        if (fs.existsSync(file)) {
          try { fs.unlinkSync(file); } catch (e) {}
        }
      }
    }
  }

  db.callLogs = db.callLogs.filter((c: any) => c.tenantId !== currentTenantId);
  await writeDB(db);
  res.json({ success: true, message: "All recorded call logs and physical MP3 files have been permanently cleared. (सभी रिकॉर्ड किए गए कॉल लॉग और ऑडियो फ़ाइलें स्थायी रूप से हटा दी गई हैं।)" });
});

export default router;
