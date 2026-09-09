import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const schoolSchema = z.object({
  name: z.string().min(2).max(120),
  city: z.string().max(80).optional().default(""),
  kind: z.string().max(30).optional().default("School"),
  students: z.coerce.number().int().min(0).default(0),
  plan: z.string().max(80).optional().default("Trial"),
});
export type SchoolInput = z.infer<typeof schoolSchema>;

export const studentSchema = z.object({
  name: z.string().min(2).max(120),
  class: z.string().max(20).optional().default(""),
  schoolId: z.string().min(1),
  feeMonthly: z.coerce.number().int().min(0).default(0),
  phone: z.string().max(20).optional().default(""),
});
export type StudentInput = z.infer<typeof studentSchema>;

export const feeCollectSchema = z.object({
  studentId: z.string().min(1),
  amount: z.coerce.number().int().min(1),
  mode: z.enum(["UPI", "Cash", "Online"]).default("UPI"),
});
export type FeeCollectInput = z.infer<typeof feeCollectSchema>;

export const staffSchema = z.object({
  name: z.string().min(2).max(120),
  role: z.string().max(80).optional().default(""),
  schoolId: z.string().min(1),
  salary: z.coerce.number().int().min(0).default(0),
});
export type StaffInput = z.infer<typeof staffSchema>;

export const attendanceSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  records: z.array(z.object({ studentId: z.string(), present: z.boolean() })).min(1).max(500),
});
export type AttendanceInput = z.infer<typeof attendanceSchema>;

export const examSchema = z.object({
  studentId: z.string().min(1),
  subject: z.string().min(1).max(60),
  marks: z.coerce.number().int().min(0).max(100),
  term: z.string().max(30).optional().default("Final"),
});
export type ExamInput = z.infer<typeof examSchema>;

export const messageSchema = z.object({
  recipient: z.string().min(2).max(160),
  template: z.string().min(2).max(120),
  language: z.enum(["Punjabi", "Hindi", "English"]).default("English"),
  schoolId: z.string().optional(),
});
export type MessageInput = z.infer<typeof messageSchema>;

export const noticeSchema = z.object({
  title: z.string().min(2).max(140),
  body: z.string().max(2000).optional().default(""),
  audience: z.enum(["All", "Parents", "Students", "Staff"]).default("Parents"),
  schoolId: z.string().optional(),
  sendWhatsapp: z.boolean().optional().default(false),
});
export type NoticeInput = z.infer<typeof noticeSchema>;

export const STAGES_APPLICATION = ["Applied", "Screening", "Interview", "Demo", "Offer", "Hired", "Rejected"] as const;
export const STAGES_LEAD = ["New", "Contacted", "Visit Scheduled", "Visited", "Admitted", "Lost"] as const;

export const jobSchema = z.object({
  title: z.string().min(2).max(120),
  schoolId: z.string().optional(),
  jobType: z.string().max(40).optional().default("Teacher"),
  salary: z.string().max(40).optional().default(""),
});
export type JobInput = z.infer<typeof jobSchema>;

export const applicationSchema = z.object({
  jobId: z.string().min(1),
  name: z.string().min(2).max(120),
  phone: z.string().max(20).optional().default(""),
  qualification: z.string().max(120).optional().default(""),
  experience: z.string().max(60).optional().default(""),
});
export type ApplicationInput = z.infer<typeof applicationSchema>;

export const leadSchema = z.object({
  parentName: z.string().min(2).max(120),
  phone: z.string().max(20).optional().default(""),
  childClass: z.string().max(20).optional().default(""),
  schoolId: z.string().optional(),
  source: z.string().max(40).optional().default("Walk-in"),
  followUp: z.string().max(20).optional().default(""),
  notes: z.string().max(500).optional().default(""),
});
export type LeadInput = z.infer<typeof leadSchema>;

export const pingSchema = z.object({
  busId: z.string().min(1),
  key: z.string().min(1),
  position: z.coerce.number().int().min(0).max(100).default(0),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),
  speed: z.coerce.number().int().min(0).max(200).optional().default(0),
});
export type PingInput = z.infer<typeof pingSchema>;

export const devicePushSchema = z.object({
  apiKey: z.string().min(1),
  records: z.array(z.object({ code: z.string().min(1).max(40), timestamp: z.string().max(40).optional().default("") })).min(1).max(1000),
});
export type DevicePushInput = z.infer<typeof devicePushSchema>;

export const importRowSchema = z.object({
  name: z.string().min(1).max(120),
  class: z.string().max(20).optional().default(""),
  feeMonthly: z.coerce.number().int().min(0).optional().default(0),
  phone: z.string().max(20).optional().default(""),
  role: z.string().max(80).optional().default(""),
  salary: z.coerce.number().int().min(0).optional().default(0),
});
export type ImportRow = z.infer<typeof importRowSchema>;
