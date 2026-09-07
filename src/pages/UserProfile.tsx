import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Pencil, Save, ShieldQuestion, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { getFunctionErrorMessage } from "@/lib/functionErrors";

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city or town were you born in?",
  "What was the name of your elementary school?",
  "What is the middle name of your oldest sibling?",
  "Custom question",
];

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, users, updateProfile } = useAuth();
  const profile = users.find((entry) => entry.id === id) || (user?.id === id ? user : null);
  const isOwnProfile = Boolean(user && profile && user.id === profile.id);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [questionChoice, setQuestionChoice] = useState(SECURITY_QUESTIONS[0]);
  const [customQuestion, setCustomQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [securityMessage, setSecurityMessage] = useState<string | null>(null);
  const [savingSecurity, setSavingSecurity] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName);
    setMiddleName(profile.middleName);
    setLastName(profile.lastName);
    setBirthdate(profile.birthdate || "");
  }, [profile]);

  if (!profile) {
    return <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">User profile not found or you do not have permission to view it.</div>;
  }

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isOwnProfile) return;
    setMessage(null);
    if (!firstName.trim() || !lastName.trim() || !birthdate) return setMessage("First name, last name, and birthdate are required.");
    try {
      setSaving(true);
      await updateProfile({ firstName, middleName, lastName, birthdate });
      setMessage("Profile updated successfully.");
      setEditing(false);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const saveSecurityQuestion = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isOwnProfile) return;
    setSecurityMessage(null);
    const question = questionChoice === "Custom question" ? customQuestion.trim() : questionChoice;
    if (question.length < 10 || answer.trim().length < 2) return setSecurityMessage("Enter a question of at least 10 characters and an answer of at least 2 characters.");
    try {
      setSavingSecurity(true);
      const { data, error } = await supabase.functions.invoke("password-recovery", { body: { action: "set-question", question, answer } });
      if (data?.error) throw new Error(data.error);
      if (error) throw new Error(await getFunctionErrorMessage(error, "Could not save security question."));
      setAnswer("");
      setSecurityMessage("Security question saved successfully.");
    } catch (error) {
      setSecurityMessage(error instanceof Error ? error.message : "Could not save security question.");
    } finally {
      setSavingSecurity(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-fade-in">
      <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="mr-2 h-4 w-4" />Back</Button>
      <Card className="card-modern border-farm-200 overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-farm-50 to-farm-100 border-b-2 border-farm-200">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3"><div className="rounded-xl bg-farm-200 p-3"><UserRound className="h-7 w-7 text-farm-700" /></div><div><CardTitle className="text-2xl">{profile.fullName}</CardTitle><CardDescription className="capitalize">{profile.role} account</CardDescription></div></div>
            {isOwnProfile && !editing && <Button className="btn-farm" onClick={() => setEditing(true)}><Pencil className="mr-2 h-4 w-4" />Edit My Profile</Button>}
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {message && <div className="mb-4 rounded-lg border border-farm-200 bg-farm-50 p-3 text-sm">{message}</div>}
          {editing ? (
            <form className="space-y-4" onSubmit={saveProfile}>
              <div className="grid gap-4 md:grid-cols-3">
                <div><label className="text-sm font-semibold">First Name</label><Input className="mt-1 h-11" value={firstName} onChange={(e) => setFirstName(e.target.value)} required /></div>
                <div><label className="text-sm font-semibold">Middle Name <span className="font-normal text-earth-500">(optional)</span></label><Input className="mt-1 h-11" value={middleName} onChange={(e) => setMiddleName(e.target.value)} /></div>
                <div><label className="text-sm font-semibold">Last Name</label><Input className="mt-1 h-11" value={lastName} onChange={(e) => setLastName(e.target.value)} required /></div>
              </div>
              <div className="max-w-sm"><label className="text-sm font-semibold">Birthdate</label><Input type="date" className="mt-1 h-11" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} max={new Date().toISOString().slice(0, 10)} required /></div>
              <div className="flex gap-3"><Button className="btn-farm" disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Saving…" : "Save Changes"}</Button><Button type="button" variant="outline" onClick={() => setEditing(false)}>Cancel</Button></div>
            </form>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              <div><p className="text-xs font-semibold uppercase text-earth-500">First Name</p><p className="mt-1 text-lg font-medium">{profile.firstName}</p></div>
              <div><p className="text-xs font-semibold uppercase text-earth-500">Middle Name</p><p className="mt-1 text-lg font-medium">{profile.middleName || "—"}</p></div>
              <div><p className="text-xs font-semibold uppercase text-earth-500">Last Name</p><p className="mt-1 text-lg font-medium">{profile.lastName}</p></div>
              <div><p className="text-xs font-semibold uppercase text-earth-500">Birthdate</p><p className="mt-1 flex items-center gap-2 text-lg font-medium"><CalendarDays className="h-4 w-4 text-earth-500" />{profile.birthdate ? new Date(`${profile.birthdate}T00:00:00`).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "Not provided"}</p></div>
              <div><p className="text-xs font-semibold uppercase text-earth-500">Username</p><p className="mt-1 text-lg font-medium">{profile.username}</p></div>
              <div><p className="text-xs font-semibold uppercase text-earth-500">Status</p><p className="mt-1 text-lg font-medium">{profile.isActive ? "Active" : "Inactive"}</p></div>
            </div>
          )}
          {!isOwnProfile && <p className="mt-6 rounded-lg border border-earth-200 bg-earth-50 p-3 text-sm text-earth-700">This profile is view-only. Only this account’s owner can edit its personal details.</p>}
        </CardContent>
      </Card>

      {isOwnProfile && (
        <Card className="card-modern border-sky-200 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-sky-50 to-sky-100 border-b-2 border-sky-200"><div className="flex items-center gap-3"><ShieldQuestion className="h-6 w-6 text-sky-700" /><div><CardTitle>Password Recovery</CardTitle><CardDescription>Set or replace your own security question.</CardDescription></div></div></CardHeader>
          <CardContent className="p-6"><form className="space-y-4" onSubmit={saveSecurityQuestion}>{securityMessage && <div className="rounded-lg border border-sky-200 bg-sky-50 p-3 text-sm">{securityMessage}</div>}<div><label className="text-sm font-semibold">Security Question</label><select className="mt-1 flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={questionChoice} onChange={(e) => setQuestionChoice(e.target.value)}>{SECURITY_QUESTIONS.map((question) => <option key={question}>{question}</option>)}</select></div>{questionChoice === "Custom question" && <div><label className="text-sm font-semibold">Your Question</label><Input className="mt-1 h-11" value={customQuestion} onChange={(e) => setCustomQuestion(e.target.value)} maxLength={200} required /></div>}<div><label className="text-sm font-semibold">Answer</label><Input type="password" autoComplete="off" className="mt-1 h-11" value={answer} onChange={(e) => setAnswer(e.target.value)} required /><p className="mt-1 text-xs text-earth-500">Answers are not case-sensitive and are stored securely.</p></div><Button className="btn-farm" disabled={savingSecurity}><ShieldQuestion className="mr-2 h-4 w-4" />{savingSecurity ? "Saving…" : "Save Security Question"}</Button></form></CardContent>
        </Card>
      )}
    </div>
  );
}
