"use client";

import { auth } from "@/firebase/firebaseClient";
import { useAuthStore } from "@/zustand/useAuthStore";
import { useInitializeStores } from "@/zustand/useInitializeStores";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
  UserButton,
  useUser,
} from "@clerk/nextjs";
import {
  signInWithCustomToken,
  signOut as firebaseSignOut,
  updateProfile,
} from "firebase/auth";
import { serverTimestamp, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { useEffect, useState } from "react";
import logo from "@/assets/svg/logo.svg"
import Image from "next/image";
import { AlignJustify } from "lucide-react";

export default function Header() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const setAuthDetails = useAuthStore((state) => state.setAuthDetails);
  const clearAuthDetails = useAuthStore((state) => state.clearAuthDetails);
  const photoUrl = useAuthStore((state) => state.authPhotoUrl);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  useInitializeStores();

  useEffect(() => {
    const syncAuthState = async () => {
      if (isSignedIn && user) {
        try {
          const token = await getToken({ template: "integration_firebase" });
          const userCredentials = await signInWithCustomToken(
            auth,
            token || ""
          );
          console.log("User signed in to Firebase:", userCredentials.user);

          // Update Firebase user profile
          await updateProfile(userCredentials.user, {
            displayName: user.fullName,
            photoURL: user.imageUrl,
          });
          setAuthDetails({
            uid: user.id,
            firebaseUid: userCredentials.user.uid,
            authEmail: user.emailAddresses[0].emailAddress,
            authDisplayName: user.fullName || "",
            authPhotoUrl: user.imageUrl,
            authReady: true,
            lastSignIn: serverTimestamp() as Timestamp,
          });
        } catch (error) {
          console.error("Error signing in with custom token:", error);
          clearAuthDetails();
        }
      } else {
        console.log("User is not signed in with Clerk");
        await firebaseSignOut(auth);
        clearAuthDetails();
      }
    };

    syncAuthState();
  }, [clearAuthDetails, getToken, isSignedIn, setAuthDetails, user]);
  
  return (
    <>
      <SignedOut>
        <div className="max-xs:hidden flex items-center justify-end border px-10 py-4">
          <SignInButton>
            <button className="text-white bg-blue-500 p-3 rounded-lg ">
              Sign In
            </button>
          </SignInButton>
        </div>
      </SignedOut>
      <SignedIn>
        <div className="flex items-center justify-between px-10 py-4 max-sm:px-[15px] max-sm:py-[10 px] shadow-md z-[99]">
          <Image src={logo} alt="logo" className="w-[115.13px] h-[60px] max-sm:w-[80.28px] max-sm:h-[50px]" />
          <div className="flex gap-[10px] items-center">
            <div className="max-sm:hidden flex gap-4">
              <Link href="/dashboard" className="hover:text-blue-700">Dashboard</Link>
              <Link href="/profile" className="hover:text-blue-700">Profile</Link>
            </div>
            <div className="sm:hidden w-[26px] h-[26px]">
              <AlignJustify className="cursor-pointer" onClick={() => setIsSidebarOpen(!isSidebarOpen)} />
            </div>
            {photoUrl && (
              <UserButton />
            )}
          </div>
        </div>
      </SignedIn>
    </>
  );
}
