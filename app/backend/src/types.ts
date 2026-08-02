import type { User } from "@prisma/client";

export type AuthenticatedUser = Pick<User, "id" | "organizationId" | "email" | "fullName" | "status">;

export type ExtractionCandidate = {
  fieldKey: string;
  fieldLabel: string;
  value: string | null;
  sourceReference: string;
  dataType: string;
  evidenceType: "documental" | "inferido";
  confidence: number;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
