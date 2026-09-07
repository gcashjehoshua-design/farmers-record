import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowLeft, CheckCircle2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { getFunctionErrorMessage } from "@/lib/functionErrors";

const accountEmail = (username: string) => {
  const value = username.trim().toLowerCase();
  return value.includes("@") ? value : `${value}@passicity.gov.ph`;
};

export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const invoke = async (body: Record<string, string>) => {
    const { data, error: invokeError } = await supabase.functions.invoke("password-recovery", { body });
    if (data?.error) throw new Error(data.error);
    if (invokeError) throw new Error(await getFunctionErrorMessage(invokeError, "The recovery service could not complete the request."));
    return data;
  };

  const findQuestion = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!username.trim()) return setError("Enter your username.");
    try {
      setLoading(true);
      const data = await invoke({ action: "get-question", email: accountEmail(username) });
      setQuestion(data.question);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not find the account.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (password.length < 8) return setError("New password must be at least 8 characters.");
    if (password !== confirmPassword) return setError("Passwords do not match.");
    try {
      setLoading(true);
      await invoke({ action: "reset-password", email: accountEmail(username), answer, password });
      setComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password could not be reset.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfaf7] flex items-center justify-center px-4 py-8">
      <Card className="card-modern w-full max-w-md border-earth-400 shadow-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-b from-farm-200 to-farm-300 border-b-2 border-earth-400 p-7">
          <div className="flex items-center gap-3"><div className="p-3 bg-farm-400 rounded-xl"><KeyRound className="w-6 h-6 text-white" /></div><div><CardTitle>Forgot Password</CardTitle><CardDescription>Recover your account using your security question.</CardDescription></div></div>
        </CardHeader>
        <CardContent className="p-6">
          {error && <div className="mb-4 flex gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</div>}
          {complete ? (
            <div className="space-y-5 text-center"><CheckCircle2 className="mx-auto w-12 h-12 text-emerald-600" /><div><h2 className="font-bold text-lg">Password updated</h2><p className="text-sm text-earth-600">You can now sign in with your new password.</p></div><Button asChild className="btn-farm w-full"><Link to="/login">Return to Sign In</Link></Button></div>
          ) : !question ? (
            <form className="space-y-4" onSubmit={findQuestion}><div><label className="text-sm font-semibold">Username</label><Input className="mt-1 h-11" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" placeholder="Enter your username" /></div><Button className="btn-farm w-full" disabled={loading}>{loading ? "Checking…" : "Continue"}</Button></form>
          ) : (
            <form className="space-y-4" onSubmit={resetPassword}><div className="rounded-lg border border-farm-200 bg-farm-50 p-3"><p className="text-xs font-semibold uppercase text-earth-500">Security Question</p><p className="mt-1 font-medium text-earth-900">{question}</p></div><div><label className="text-sm font-semibold">Answer</label><Input className="mt-1 h-11" value={answer} onChange={(e) => setAnswer(e.target.value)} autoComplete="off" required /></div><div><label className="text-sm font-semibold">New Password</label><Input type="password" className="mt-1 h-11" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required /></div><div><label className="text-sm font-semibold">Confirm New Password</label><Input type="password" className="mt-1 h-11" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required /></div><Button className="btn-farm w-full" disabled={loading}>{loading ? "Updating…" : "Reset Password"}</Button><button type="button" className="w-full text-sm text-earth-600 hover:underline" onClick={() => { setQuestion(""); setAnswer(""); }}>Use a different account</button></form>
          )}
          {!complete && <Link to="/login" className="mt-5 flex items-center justify-center gap-2 text-sm font-medium text-earth-700 hover:underline"><ArrowLeft className="w-4 h-4" />Back to Sign In</Link>}
        </CardContent>
      </Card>
    </div>
  );
}
