import { Header } from "@/components/Header";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

type EditableUser = {
  name?: string | null;
  email?: string | null;
  role?: string | null;
  studentProfile?: { course?: string; semester?: string } | null;
  adminProfile?: { department?: string } | null;
};

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // The form mounts only once the profile has loaded, so its initial values
  // come straight from data instead of an effect that syncs state.
  return <ProfileForm user={user as EditableUser} />;
}

function ProfileForm({ user }: { user: EditableUser }) {
  const updateProfile = useMutation(api.users.updateMyProfile);
  const role = user.role;

  const [name, setName] = useState(user.name || "");
  const [course, setCourse] = useState(user.studentProfile?.course || "");
  const [semester, setSemester] = useState(user.studentProfile?.semester || "");
  const [department, setDepartment] = useState(
    user.adminProfile?.department || "",
  );
  const [isSaving, setIsSaving] = useState(false);

  const dashboardLink =
    role === "admin" ? "/admin/dashboard" : "/student/dashboard";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const patch: {
        name?: string;
        course?: string;
        semester?: string;
        department?: string;
      } = {};

      if (name !== (user.name || "")) patch.name = name;

      if (role === "student") {
        if (course !== (user.studentProfile?.course || "")) patch.course = course;
        if (semester !== (user.studentProfile?.semester || "")) {
          patch.semester = semester;
        }
      }

      if (role === "admin") {
        if (department !== (user.adminProfile?.department || "")) {
          patch.department = department;
        }
      }

      if (Object.keys(patch).length === 0) {
        toast.info("No changes to save");
        return;
      }

      await updateProfile(patch);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-lg">
          <Link
            to={dashboardLink}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="size-3.5" />
            Back to Dashboard
          </Link>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">My Profile</CardTitle>
            </CardHeader>

            <form onSubmit={handleSave}>
              <CardContent className="space-y-5">
                {/* Name — always editable */}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSaving}
                    required
                  />
                </div>

                {/* Email — read-only display */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user.email || ""}
                    disabled
                    className="opacity-60"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed here.
                  </p>
                </div>

                {/* Role badge */}
                <div className="space-y-2">
                  <Label>Role</Label>
                  <div>
                    <span className="inline-flex items-center rounded-md bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary capitalize">
                      {role}
                    </span>
                  </div>
                </div>

                {/* Student-specific fields */}
                {role === "student" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="course">Course</Label>
                      <Input
                        id="course"
                        value={course}
                        onChange={(e) => setCourse(e.target.value)}
                        disabled={isSaving}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="semester">Semester</Label>
                      <Select
                        value={semester}
                        onValueChange={setSemester}
                        disabled={isSaving}
                      >
                        <SelectTrigger id="semester">
                          <SelectValue placeholder="Select semester" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <SelectItem key={s} value={String(s)}>
                              Semester {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                {/* Admin-specific fields */}
                {role === "admin" && (
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      disabled={isSaving}
                      required
                    />
                  </div>
                )}
              </CardContent>

              <CardFooter className="border-t border-border px-6 py-4">
                <Button type="submit" disabled={isSaving} className="gap-1.5">
                  {isSaving ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="size-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
