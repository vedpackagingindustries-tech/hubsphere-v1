import { Router, Response } from "express";
import { readDB, writeDB } from "../utils/fileLock";
import { authenticateUser, AuthenticatedRequest } from "../middleware/auth";
import { GoogleGenAI, Type } from "@google/genai";

const router = Router();

// Protect all copilot routes
router.use(authenticateUser);

// Helper to generate realistic analysis if Gemini is not configured or fails
function getMockCopilotAnalysis(lead: any, callLogs: any[]) {
  // Simple heuristic analysis for fallback
  const requirements = (lead.requirements || "").toLowerCase();
  const notes = (lead.notes || "").toLowerCase();
  
  let baseScore = 50;
  if (lead.priority === "High") baseScore += 20;
  else if (lead.priority === "Low") baseScore -= 15;

  if (lead.status === "Interested" || lead.status === "Spoke") baseScore += 15;
  if (lead.status === "Closed Won") baseScore = 100;
  if (lead.status === "Closed Lost") baseScore = 5;

  if (requirements.includes("urgent") || requirements.includes("immediately")) baseScore += 10;
  if (notes.includes("not ready") || notes.includes("budget constraint")) baseScore -= 15;

  const leadScore = Math.min(Math.max(baseScore, 0), 100);
  const salesProbability = Math.min(Math.max(Math.round(leadScore * 0.9), 5), 98);

  let riskLevel: 'Low' | 'Medium' | 'High' = 'Medium';
  let riskExplanation = "Customer has moderate engagement. Needs constant engagement and prompt responses.";
  
  if (leadScore >= 75) {
    riskLevel = 'Low';
    riskExplanation = "Strong buying signal. Customer highly engaged with clear requirements and budget setup.";
  } else if (leadScore < 40) {
    riskLevel = 'High';
    riskExplanation = "Lack of responsiveness or budget fit. High chance of lead drop. Requires relationship rebuilding or better discount options.";
  }

  let suggestedNextAction = "Initiate a value-discovery call with the decision-maker to lock down exact specifications and provide custom quotes.";
  if (lead.status === "New") {
    suggestedNextAction = "Attempt first telecall immediately. Introduce standard product catalogs and ask for specific design measurements.";
  } else if (lead.status === "Interested") {
    suggestedNextAction = "Send detailed design portfolio on WhatsApp and schedule a direct video walkthrough of product customizers.";
  } else if (leadScore < 40) {
    suggestedNextAction = "Re-engage with a custom discount offer or trial package to overcome the pricing roadblock.";
  }

  const notesSummary = lead.notesList && lead.notesList.length > 0 
    ? `Customer notes history indicates: "${lead.notesList.slice(0, 2).map((n: any) => n.text).join('; ')}"`
    : "No recent conversation logs recorded.";

  const summary = `The client ${lead.name} has shown interest in our ${lead.requirements || 'custom offerings'}. Priority is ${lead.priority || 'Medium'} and stage is ${lead.status || 'New'}. ${notesSummary} The current progress shows ${callLogs.length} total call contacts made. Recommended course is to follow up closely.`;

  return {
    leadScore,
    scoreExplanation: `Lead score estimated at ${leadScore}% based on ${lead.priority || 'Medium'} priority, lead stage '${lead.status}', and requirement alignment.`,
    suggestedNextAction,
    summary,
    riskLevel,
    riskExplanation,
    salesProbability,
    updatedAt: new Date().toISOString()
  };
}

// POST /api/copilot/analyze-lead
router.post("/analyze-lead", async (req: AuthenticatedRequest, res: Response) => {
  const { leadId } = req.body;
  if (!leadId) {
    return res.status(400).json({ error: "Lead ID is required" });
  }

  const db = readDB();
  const currentTenantId = req.tenantId || "t-default";

  const lead = db.leads.find((l: any) => l.id === leadId && l.tenantId === currentTenantId);
  if (!lead) {
    return res.status(404).json({ error: "Lead not found in tenant" });
  }

  const callLogs = (db.callLogs || []).filter((c: any) => c.leadId === leadId && c.tenantId === currentTenantId);

  // Check if Gemini API key exists
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    // If no real API key is configured, return beautifully generated realistic analytics
    const analysis = getMockCopilotAnalysis(lead, callLogs);
    lead.aiCopilotAnalysis = analysis;
    
    // Auto-save the lead's AI analysis back to database
    await writeDB(db);
    return res.json({ success: true, isMock: true, analysis });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const callLogsText = callLogs.map((c: any, index: number) => {
      return `Call ${index + 1}: Status: ${c.status}, Duration: ${c.duration}s, Notes: ${c.notes || 'N/A'}`;
    }).join("\n");

    const prompt = `
You are an expert Enterprise B2B Sales consultant and CRM analyst.
Analyze this lead to provide sales intelligence.

Lead Details:
- Name: ${lead.name}
- Email: ${lead.email}
- Priority: ${lead.priority || "Medium"}
- Deal Value: ₹${lead.dealValue || 0}
- Current Status/Stage: ${lead.status}
- Requirements: ${lead.requirements || "None specified"}
- Historical Notes: ${JSON.stringify(lead.notesList || [])}

Call History Logs:
${callLogsText || "No telecalls made yet."}

Please analyze and return:
1. leadScore: An integer from 0 to 100 representing readiness to buy.
2. scoreExplanation: Short clear professional reason why this score was assigned.
3. suggestedNextAction: A highly contextual, actionable next sales step.
4. summary: A professional 3-4 sentence CRM executive summary of the lead's situation and relationship.
5. riskLevel: Risk level of losing the deal ('Low', 'Medium', or 'High').
6. riskExplanation: What risk factors are present or why the deal is secure.
7. salesProbability: Predicted probability percentage (0 to 100) of winning this deal.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are HubSphere's AI Sales Copilot. Speak in standard professional enterprise sales terminology. Keep descriptions crisp, clear and insightful. Never invent placeholders like [Insert name here]. Always respond strictly in valid JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: [
            "leadScore",
            "scoreExplanation",
            "suggestedNextAction",
            "summary",
            "riskLevel",
            "riskExplanation",
            "salesProbability"
          ],
          properties: {
            leadScore: {
              type: Type.INTEGER,
              description: "The calculated readiness score (0-100)"
            },
            scoreExplanation: {
              type: Type.STRING,
              description: "Brief rationale of the score (max 120 characters)"
            },
            suggestedNextAction: {
              type: Type.STRING,
              description: "Specific, contextual next sales activity to take"
            },
            summary: {
              type: Type.STRING,
              description: "Executive brief summarizing requirements and status"
            },
            riskLevel: {
              type: Type.STRING,
              enum: ["Low", "Medium", "High"],
              description: "Risk level of losing the lead"
            },
            riskExplanation: {
              type: Type.STRING,
              description: "Clear reasons explaining the risk level"
            },
            salesProbability: {
              type: Type.INTEGER,
              description: "Percentage likelihood of winning (0-100)"
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty response from Gemini API");
    }

    const analysisResult = JSON.parse(text.trim());
    
    const finalizedAnalysis = {
      leadScore: Math.min(Math.max(Number(analysisResult.leadScore) || 50, 0), 100),
      scoreExplanation: analysisResult.scoreExplanation || "AI analysis complete.",
      suggestedNextAction: analysisResult.suggestedNextAction || "Follow up on requirements.",
      summary: analysisResult.summary || "No summary provided.",
      riskLevel: (analysisResult.riskLevel === 'Low' || analysisResult.riskLevel === 'High') ? analysisResult.riskLevel : 'Medium',
      riskExplanation: analysisResult.riskExplanation || "Standard risk levels evaluated.",
      salesProbability: Math.min(Math.max(Number(analysisResult.salesProbability) || 50, 0), 100),
      updatedAt: new Date().toISOString()
    };

    // Update lead database
    lead.aiCopilotAnalysis = finalizedAnalysis;
    await writeDB(db);

    res.json({ success: true, isMock: false, analysis: finalizedAnalysis });

  } catch (error: any) {
    console.error("AI Sales Copilot generation error:", error);
    // Graceful fallback on API error
    const analysis = getMockCopilotAnalysis(lead, callLogs);
    lead.aiCopilotAnalysis = analysis;
    await writeDB(db);
    res.json({ success: true, isMock: true, fallbackError: error.message, analysis });
  }
});

export default router;
