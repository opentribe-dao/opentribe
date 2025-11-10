"use client";

import { useSession } from "@packages/auth/client";
import { Button } from "@packages/base/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@packages/base/components/ui/card";
import { Label } from "@packages/base/components/ui/label";
import { Switch } from "@packages/base/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@packages/base/components/ui/tabs";
import {
  Bell,
  ChevronLeft,
  Loader2,
  Mail,
  Save,
  Shield,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface NotificationSettings {
  grantAppUpdate: boolean;
  bountySubmission: boolean;
  commentReply: boolean;
  newBountyMatchingSkills: boolean;
}

const SettingsPage = () => {
  const { data: session, isPending: sessionLoading } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("notifications");

  const [emailNotifications, setEmailNotifications] =
    useState<NotificationSettings>({
      grantAppUpdate: true,
      bountySubmission: true,
      commentReply: true,
      newBountyMatchingSkills: false,
    });

  const [inAppNotifications, setInAppNotifications] =
    useState<NotificationSettings>({
      grantAppUpdate: true,
      bountySubmission: true,
      commentReply: true,
      newBountyMatchingSkills: true,
    });

  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.user?.id) return;

      try {
        setLoading(true);
        // In a real implementation, we would fetch notification settings from the API
        // For now, we'll use default values
        setLoading(false);
      } catch (error) {
        console.error("Error fetching settings:", error);
        toast.error("Failed to load settings");
        setLoading(false);
      }
    };

    if (!sessionLoading && session?.user) {
      fetchSettings();
    } else if (!(sessionLoading || session?.user)) {
      router.push("/");
    }
  }, [session, sessionLoading, router]);

  const handleSaveNotifications = async () => {
    try {
      setSaving(true);
      // In a real implementation, we would save to the API
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call
      toast.success("Notification preferences saved!");
    } catch (error) {
      console.error("Error saving notifications:", error);
      toast.error("Failed to save notification preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading || sessionLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E6007A]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container relative z-10 mx-auto max-w-4xl px-4 py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            className="mb-4 flex items-center gap-2 text-white/60 hover:text-white"
            href={`/profile/${session?.user?.username || session?.user.id}`}
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Profile
          </Link>
          <h1 className="font-bold text-3xl text-white">Settings</h1>
          <p className="mt-2 text-white/60">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs onValueChange={setActiveTab} value={activeTab}>
          <TabsList className="mb-6 border-white/20 bg-white/10">
            <TabsTrigger
              className="data-[state=active]:bg-white/20"
              value="notifications"
            >
              <Bell className="mr-2 h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-white/20"
              value="account"
            >
              <User className="mr-2 h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger
              className="data-[state=active]:bg-white/20"
              value="privacy"
            >
              <Shield className="mr-2 h-4 w-4" />
              Privacy
            </TabsTrigger>
          </TabsList>

          <TabsContent className="space-y-6" value="notifications">
            {/* Email Notifications */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Mail className="h-5 w-5" />
                  Email Notifications
                </CardTitle>
                <CardDescription className="text-white/60">
                  Choose what updates you receive via email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white" htmlFor="email-grant-updates">
                      Grant Application Updates
                    </Label>
                    <p className="text-sm text-white/60">
                      Get notified when your grant applications are reviewed
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications.grantAppUpdate}
                    id="email-grant-updates"
                    onCheckedChange={(checked) =>
                      setEmailNotifications((prev) => ({
                        ...prev,
                        grantAppUpdate: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white" htmlFor="email-bounty-subs">
                      Bounty Submissions
                    </Label>
                    <p className="text-sm text-white/60">
                      Notifications about your bounty submissions
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications.bountySubmission}
                    id="email-bounty-subs"
                    onCheckedChange={(checked) =>
                      setEmailNotifications((prev) => ({
                        ...prev,
                        bountySubmission: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white" htmlFor="email-comments">
                      Comment Replies
                    </Label>
                    <p className="text-sm text-white/60">
                      When someone replies to your comments
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications.commentReply}
                    id="email-comments"
                    onCheckedChange={(checked) =>
                      setEmailNotifications((prev) => ({
                        ...prev,
                        commentReply: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white" htmlFor="email-matching">
                      Matching Opportunities
                    </Label>
                    <p className="text-sm text-white/60">
                      New bounties matching your skills
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications.newBountyMatchingSkills}
                    id="email-matching"
                    onCheckedChange={(checked) =>
                      setEmailNotifications((prev) => ({
                        ...prev,
                        newBountyMatchingSkills: checked,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* In-App Notifications */}
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Bell className="h-5 w-5" />
                  In-App Notifications
                </CardTitle>
                <CardDescription className="text-white/60">
                  Notifications within the Opentribe platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white" htmlFor="app-grant-updates">
                      Grant Application Updates
                    </Label>
                    <p className="text-sm text-white/60">
                      Get notified when your grant applications are reviewed
                    </p>
                  </div>
                  <Switch
                    checked={inAppNotifications.grantAppUpdate}
                    id="app-grant-updates"
                    onCheckedChange={(checked) =>
                      setInAppNotifications((prev) => ({
                        ...prev,
                        grantAppUpdate: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white" htmlFor="app-bounty-subs">
                      Bounty Submissions
                    </Label>
                    <p className="text-sm text-white/60">
                      Notifications about your bounty submissions
                    </p>
                  </div>
                  <Switch
                    checked={inAppNotifications.bountySubmission}
                    id="app-bounty-subs"
                    onCheckedChange={(checked) =>
                      setInAppNotifications((prev) => ({
                        ...prev,
                        bountySubmission: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white" htmlFor="app-comments">
                      Comment Replies
                    </Label>
                    <p className="text-sm text-white/60">
                      When someone replies to your comments
                    </p>
                  </div>
                  <Switch
                    checked={inAppNotifications.commentReply}
                    id="app-comments"
                    onCheckedChange={(checked) =>
                      setInAppNotifications((prev) => ({
                        ...prev,
                        commentReply: checked,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-white" htmlFor="app-matching">
                      Matching Opportunities
                    </Label>
                    <p className="text-sm text-white/60">
                      New bounties matching your skills
                    </p>
                  </div>
                  <Switch
                    checked={inAppNotifications.newBountyMatchingSkills}
                    id="app-matching"
                    onCheckedChange={(checked) =>
                      setInAppNotifications((prev) => ({
                        ...prev,
                        newBountyMatchingSkills: checked,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                className="bg-[#E6007A] text-white hover:bg-[#E6007A]/90"
                disabled={saving}
                onClick={handleSaveNotifications}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Preferences
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent className="space-y-6" value="account">
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">
                  Account Information
                </CardTitle>
                <CardDescription className="text-white/60">
                  Your account details and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-white">Email Address</Label>
                  <p className="mt-1 text-white/80">{session?.user?.email}</p>
                </div>
                <div>
                  <Label className="text-white">Account ID</Label>
                  <p className="mt-1 font-mono text-sm text-white/80">
                    {session?.user?.id}
                  </p>
                </div>
                <div className="pt-4">
                  <Button
                    className="border-white/20 text-white hover:bg-white/10"
                    variant="outline"
                  >
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-red-400 text-white">
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-white/60">
                  Irreversible actions for your account
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  variant="outline"
                >
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent className="space-y-6" value="privacy">
            <Card className="border-white/10 bg-white/5 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-white">Privacy Settings</CardTitle>
                <CardDescription className="text-white/60">
                  Control who can see your information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="text-blue-400 text-sm">
                    Privacy settings can be managed from your{" "}
                    <Link className="underline" href="/profile/edit">
                      profile edit page
                    </Link>
                    .
                  </p>
                </div>
                <div>
                  <h4 className="mb-2 font-medium text-white">
                    What others can see:
                  </h4>
                  <ul className="space-y-2 text-sm text-white/60">
                    <li>• Your name and profile picture</li>
                    <li>• Organizations you're part of</li>
                    <li>• Public activity (applications, submissions)</li>
                    <li>• Skills and interests (if not private)</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPage;
