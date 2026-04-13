"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/tms/AppShell";
import { useAuth } from "@/lib/auth-context";
import { authStore } from "@/lib/store";
import {
  Shield, Bell, Eye, EyeOff, ShieldCheck, ShieldOff,
  KeyRound, CheckCircle, AlertCircle,
} from "lucide-react";

export default function SettingsPage() {
  const { user, refresh } = useAuth();

  // Password change
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  // MFA
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [mfaSuccess, setMfaSuccess] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const generatedSecret = "123456"; // Demo TOTP secret

  // Notification prefs
  const [notifAssigned, setNotifAssigned] = useState(true);
  const [notifStatus, setNotifStatus] = useState(true);
  const [notifConn, setNotifConn] = useState(true);
  const [notifSaved, setNotifSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setNotifAssigned(user.notifAssigned);
      setNotifStatus(user.notifStatusUpdate);
      setNotifConn(user.notifConnectionRequest);
    }
  }, [user]);

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(""); setPwSuccess("");
    if (newPw.length < 8) { setPwError("New password must be at least 8 characters."); return; }
    if (newPw !== confirmPw) { setPwError("Passwords do not match."); return; }
    if (!user) return;
    // Verify current password: try logging in (non-destructive since session already exists)
    const loginTest = authStore.login(user.email, currentPw);
    if (!loginTest.ok) { setPwError("Current password is incorrect."); return; }
    // Re-establish session in case login overwrote it (it won't since it just saves again)
    setPwLoading(true);
    const result = authStore.resetPassword(user.email, newPw);
    setPwLoading(false);
    if (!result.ok) { setPwError(result.error || "Password change failed."); return; }
    setPwSuccess("Password changed successfully!");
    setCurrentPw(""); setNewPw(""); setConfirmPw("");
  };

  const handleEnableMfa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setMfaError(""); setMfaSuccess("");
    if (mfaCode !== generatedSecret) {
      setMfaError("Invalid code. For this demo, use: 123456");
      return;
    }
    setMfaLoading(true);
    authStore.setupMfa(user.id, generatedSecret);
    refresh();
    setMfaLoading(false);
    setMfaSuccess("MFA enabled! You will need to enter a code on each login.");
    setMfaCode("");
  };

  const handleDisableMfa = () => {
    if (!user) return;
    authStore.disableMfa(user.id);
    refresh();
    setMfaSuccess("MFA disabled.");
    setMfaError("");
  };

  const handleSaveNotifs = () => {
    if (!user) return;
    authStore.updateNotifPrefs(user.id, {
      notifAssigned,
      notifStatusUpdate: notifStatus,
      notifConnectionRequest: notifConn,
    });
    refresh();
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 2000);
  };

  if (!user) return null;

  return (
    <AppShell>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Security, MFA, and notification preferences. (TMS-11, TMS-12, TMS-13, TMS-38)
          </p>
        </div>

        {/* Change Password */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-primary" /> Change Password
          </h2>
          {pwError && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" /> {pwError}
            </div>
          )}
          {pwSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" /> {pwSuccess}
            </div>
          )}
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Current Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"} required
                  placeholder="Enter current password"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-10"
                  value={currentPw} onChange={(e) => setCurrentPw(e.target.value)}
                />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">New Password</label>
                <input
                  type="password" required minLength={8}
                  placeholder="Min. 8 characters"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={newPw} onChange={(e) => setNewPw(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Confirm New Password</label>
                <input
                  type="password" required
                  placeholder="Repeat new password"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" disabled={pwLoading} className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
              {pwLoading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </div>

        {/* MFA */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-1 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" /> Multi-Factor Authentication (MFA)
          </h2>
          <p className="text-xs text-muted-foreground mb-4">
            Add an extra layer of security by requiring a code on each login. (TMS-12)
          </p>

          <div className={`flex items-center gap-3 p-3 rounded-lg mb-4 ${user.mfaEnabled ? "bg-green-50 border border-green-200" : "bg-muted/50 border border-border"}`}>
            {user.mfaEnabled ? (
              <>
                <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-700">MFA is Enabled</p>
                  <p className="text-xs text-green-600">Your account is protected with two-factor authentication.</p>
                </div>
              </>
            ) : (
              <>
                <ShieldOff className="w-5 h-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-foreground">MFA is Disabled</p>
                  <p className="text-xs text-muted-foreground">Enable MFA for stronger account security.</p>
                </div>
              </>
            )}
          </div>

          {mfaError && <div className="mb-3 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">{mfaError}</div>}
          {mfaSuccess && <div className="mb-3 p-3 rounded-lg bg-green-50 text-green-700 text-sm border border-green-200">{mfaSuccess}</div>}

          {!user.mfaEnabled ? (
            <form onSubmit={handleEnableMfa} className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 border border-border">
                <p className="text-xs font-medium text-foreground mb-2">Demo TOTP Setup</p>
                <p className="text-xs text-muted-foreground mb-3">
                  In production this would show a QR code. For this demo, your secret code is:
                </p>
                <div className="bg-primary/10 rounded-lg p-3 text-center">
                  <span className="text-2xl font-mono font-bold text-primary tracking-widest">{generatedSecret}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Enter the code above to confirm</label>
                <input
                  type="text" required maxLength={6}
                  placeholder="Enter 6-digit code"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                  value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <button type="submit" disabled={mfaLoading} className="px-5 py-2.5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
                {mfaLoading ? "Enabling..." : "Enable MFA"}
              </button>
            </form>
          ) : (
            <button
              onClick={handleDisableMfa}
              className="flex items-center gap-2 px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors"
            >
              <ShieldOff className="w-4 h-4" /> Disable MFA
            </button>
          )}
        </div>

        {/* Notification Preferences */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Notification Preferences (TMS-38)
          </h2>
          <div className="space-y-4">
            {[
              { id: "notif-assigned", label: "Task Assigned", desc: "When a task is assigned to you", state: notifAssigned, set: setNotifAssigned },
              { id: "notif-status", label: "Status Updates", desc: "When tasks you created have status changes", state: notifStatus, set: setNotifStatus },
              { id: "notif-conn", label: "Connection Requests", desc: "When someone sends you a connection request", state: notifConn, set: setNotifConn },
            ].map((pref) => (
              <div key={pref.id} className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{pref.label}</p>
                  <p className="text-xs text-muted-foreground">{pref.desc}</p>
                </div>
                <button
                  onClick={() => pref.set(!pref.state)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${pref.state ? "bg-primary" : "bg-muted"}`}
                  role="switch"
                  aria-checked={pref.state}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${pref.state ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleSaveNotifs}
            className={`mt-4 px-5 py-2.5 font-semibold text-sm rounded-lg transition-all
              ${notifSaved ? "bg-green-600 text-white" : "bg-primary text-primary-foreground hover:opacity-90"}`}
          >
            {notifSaved ? "Saved!" : "Save Preferences"}
          </button>
        </div>

        {/* Session info */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-foreground mb-4 flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" /> Session Security (TMS-13)
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Your session expires after 8 hours of inactivity. You can securely end your session at any time.
          </p>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 border border-green-200">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-green-700 font-medium">Active session — logged in as {user.email}</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
