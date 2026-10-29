import { describe, it, expect, beforeEach } from "vitest";
import { localAuth, localSupabase } from "@/integrations/supabase/local-client";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { loadDatabase, registerUser, loginUser, executeQuery } from "@/lib/server-db";

describe("Permanent Local Backend & Database", () => {
  beforeEach(async () => {
    loadDatabase();
    await localAuth.signOut();
  });

  it("identifies local backend active when Supabase cloud is not configured", () => {
    expect(isSupabaseConfigured()).toBe(false);
  });

  it("supports user registration with profile fields", () => {
    const testEmail = `student_${Date.now()}@campus.edu`;
    const result = registerUser({
      email: testEmail,
      password: "mypassword123",
      name: "Permanent Resident",
      room_number: "C-101",
      hostel_block: "Block C",
      phone: "+91 91234 56789",
    });

    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(testEmail);
    expect(result.session.access_token).toBeDefined();

    const queryRes = executeQuery({
      table: "profiles",
      action: "select",
      filters: [{ col: "id", op: "eq", val: result.user.id }],
      single: true,
    });

    expect(queryRes.data).toBeDefined();
    expect(queryRes.data.name).toBe("Permanent Resident");
    expect(queryRes.data.room_number).toBe("C-101");
  });

  it("authenticates existing student user with correct password", () => {
    const result = loginUser("student@campus.edu", "student123");
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe("student@campus.edu");
    expect(result.session.access_token).toBeDefined();
  });

  it("authenticates existing admin user with correct password", () => {
    const result = loginUser("admin@campus.edu", "admin123");
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe("admin@campus.edu");

    const roleRes = executeQuery({
      table: "user_roles",
      action: "select",
      filters: [{ col: "user_id", op: "eq", val: result.user.id }],
    });

    expect(roleRes.data.some((r: any) => r.role === "admin")).toBe(true);
  });

  it("fails login with incorrect password", () => {
    expect(() => loginUser("student@campus.edu", "wrongpassword")).toThrow(
      "Invalid email or password",
    );
  });

  it("supports complaint CRUD operations on permanent storage", () => {
    // 1. Insert complaint
    const insertRes = executeQuery({
      table: "complaints",
      action: "insert",
      payload: {
        student_id: "student-0000-0000-0000-000000000001",
        title: "Water heater thermostat failure",
        description: "Geyser is overheating and not shutting off automatically.",
        category: "water",
        hostel_block: "Block B",
        room_number: "B-204",
      },
    });

    expect(insertRes.data).toBeDefined();
    expect(insertRes.data.id).toBeDefined();
    const complaintId = insertRes.data.id;

    // 2. Select complaint
    const selectRes = executeQuery({
      table: "complaints",
      action: "select",
      filters: [{ col: "id", op: "eq", val: complaintId }],
      single: true,
    });

    expect(selectRes.data.title).toBe("Water heater thermostat failure");

    // 3. Update complaint
    const updateRes = executeQuery({
      table: "complaints",
      action: "update",
      filters: [{ col: "id", op: "eq", val: complaintId }],
      payload: { status: "in_progress", assigned_to: "Technician Ashok" },
    });

    expect(updateRes.data.status).toBe("in_progress");

    // 4. Delete complaint
    executeQuery({
      table: "complaints",
      action: "delete",
      filters: [{ col: "id", op: "eq", val: complaintId }],
    });

    const deletedCheck = executeQuery({
      table: "complaints",
      action: "select",
      filters: [{ col: "id", op: "eq", val: complaintId }],
      single: true,
    });

    expect(deletedCheck.data).toBeNull();
  });
});
