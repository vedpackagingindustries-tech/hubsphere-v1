import { Router } from "express";
import { 
  registerCompanyController, 
  completeSetupController 
} from "../controllers/registration.controller";

const router = Router();

// POST /api/v1/auth/register-company
router.post("/register-company", registerCompanyController);

// POST /api/v1/auth/complete-setup
router.post("/complete-setup", completeSetupController);

export default router;
