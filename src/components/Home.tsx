"use client";

import { useAuthStore } from "@/zustand/useAuthStore";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import Footer from "./Footer";
import logo from "@/assets/svg/logo.svg"

export default function Home() {
  const uid = useAuthStore((state) => state.uid);
  const photoUrl = useAuthStore((state) => state.authPhotoUrl);
  const firebaseUid = useAuthStore((state) => state.firebaseUid);
  const fullName = useAuthStore((state) => state.authDisplayName);

  return (
    <div className="flex flex-col h-full">
      <SignedIn>
        <div className="flex items-center justify-center h-full gap-[100px]">
          <div className="flex flex-col gap-[30px] bg-white shadow-pop-up-shadow rounded-2xl p-[30px] max-w-[616px] w-full">
            <h2 className="text-center font-medium  text-[26px]">Docushare AI Demo</h2>
            <div className="flex flex-col items-center gap-5">
                <div className="flex flex-col items-center mb-[10px]">
                  <div className="overflow-hidden w-20 h-20 rounded-full">
                    {photoUrl && (
                      <Image
                        src={photoUrl}
                        width={80}
                        height={80}
                        alt={"user"}
                        priority
                      />
                    )}
                  </div>
                <div className="text-center mt-[10px] text-[22px]">{fullName} Romik M </div>
              </div>

              <div className="w-full">
                <div className="text-base">Clerk User</div>
                <div className="text-sm py-[10px] px-[15px] text-[#1E1E1E] bg-lightGray rounded-lg">
                  {uid || "No User"}
                </div>
              </div>

              <div className="w-full">
                <div className="text-base">Firebase User</div>
                <div className="text-sm py-[10px] px-[15px] text-[#1E1E1E] bg-lightGray rounded-lg">
                  {firebaseUid || "No User"}
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              {firebaseUid && (
                <Link href="/dashboard">
                  <div className=" bg-blue-500 text-white rounded-lg px-8 py-3 text-center">
                    Dashboard
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </SignedIn>
      <SignedOut>
        <div className="flex flex-col items-center h-full gap-[100px] pt-[38px]">
          <div>
            <Image src={logo} alt="logo" className="w-[254px] h-[130px]" />
          </div>
          <div className="flex flex-col gap-5 bg-white shadow-pop-up-shadow rounded-2xl px-8 py-[50px] max-w-[616px] w-full">
            <div className="flex flex-col items-center">
              <h2 className="font-medium text-[32px]">Welcome to the Docushare AI Demo!</h2>
              <div className="text-lg text-richBlack font-medium text-center mt-5 px-9">
                This demo showcases the capabilities of the TipTap as an editor,
                Firebase as a realtime database, and collaborative document
                editing with AI tools integrated.
              </div>
            </div>
          </div>
        </div>
      </SignedOut>
      <Footer />
    </div>
  );
}
