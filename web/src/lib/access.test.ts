import { describe, expect, it } from "vitest";
import { canAccessPath, canManageUsers, rolesForPath, studentCanWork } from "./access";

describe("rolesForPath", () => {
  it("закрывает разделы ролями", () => {
    expect(rolesForPath("/admin/users")).toEqual(["admin"]);
    expect(rolesForPath("/teacher")).toEqual(["teacher"]);
    expect(rolesForPath("/student/tasks/1")).toEqual(["student"]);
    expect(rolesForPath("/parent")).toEqual(["parent"]);
  });

  it("не считает разделом похожие пути", () => {
    expect(rolesForPath("/administrator")).toBeNull();
    expect(rolesForPath("/login")).toBeNull();
    expect(rolesForPath("/")).toBeNull();
  });
});

describe("canAccessPath", () => {
  it("пускает роль только в свой раздел", () => {
    expect(canAccessPath("admin", "/admin/users")).toBe(true);
    expect(canAccessPath("teacher", "/admin/users")).toBe(false);
    expect(canAccessPath("student", "/admin")).toBe(false);
    expect(canAccessPath("parent", "/student")).toBe(false);
    expect(canAccessPath("student", "/student")).toBe(true);
  });

  it("открытые пути доступны всем", () => {
    expect(canAccessPath("student", "/login")).toBe(true);
  });
});

describe("права", () => {
  it("пользователями управляет только admin", () => {
    expect(canManageUsers("admin")).toBe(true);
    expect(canManageUsers("teacher")).toBe(false);
    expect(canManageUsers("student")).toBe(false);
    expect(canManageUsers("parent")).toBe(false);
  });

  it("ученик работает только после согласия родителя", () => {
    expect(studentCanWork(null)).toBe(false);
    expect(studentCanWork(new Date("2026-09-01"))).toBe(true);
  });
});
