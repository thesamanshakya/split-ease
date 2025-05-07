"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Camera, Loader2, Check, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get current user from our session API
        const response = await fetch("/api/auth/session", {
          method: "GET",
          credentials: "include",
          headers: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch session:", response.status);
          router.push("/auth");
          return;
        }

        const sessionData = await response.json();

        if (!sessionData.isLoggedIn || !sessionData.user) {
          router.push("/auth");
          return;
        }

        setUser(sessionData.user);
        setName(sessionData.user.name || "");
        setEmail(sessionData.user.email || "");
      } catch (error) {
        console.error("Error fetching user profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const response = await fetch("/api/profile/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setUser(data.user);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update profile"
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a preview URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleCancelUpload = () => {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadImage = async () => {
    if (!fileInputRef.current?.files?.[0]) {
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", fileInputRef.current.files[0]);

      const response = await fetch("/api/profile/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      setUser(data.user);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success("Profile image updated successfully");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload image"
      );
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Toaster position="top-center" />
      <h1 className="text-3xl font-bold mb-8">Your Profile</h1>

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <div className="h-32 w-32 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-4xl overflow-hidden">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Preview"
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                ) : user?.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt={user.name}
                    width={128}
                    height={128}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  user?.name?.charAt(0) || "U"
                )}
              </div>
              <button
                type="button"
                onClick={handleUploadClick}
                className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors"
                disabled={uploading}
              >
                <Camera className="h-5 w-5" />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />

            {previewUrl && (
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  onClick={handleUploadImage}
                  disabled={uploading}
                  className="bg-indigo-600 hover:bg-indigo-700"
                  size="sm"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Check className="h-4 w-4 mr-1" />
                  )}
                  Save
                </Button>
                <Button
                  type="button"
                  onClick={handleCancelUpload}
                  variant="outline"
                  size="sm"
                  disabled={uploading}
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <form onSubmit={handleUpdateProfile} className="flex-1">
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={updating}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {updating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                "Update Profile"
              )}
            </Button>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">User ID</p>
            <p className="font-mono text-sm">{user?.id}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email</p>
            <p>{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
