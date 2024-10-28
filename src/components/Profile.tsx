"use client";

import ProfileComponent from "./ProfileComponent";
import AuthDataDisplay from "./AuthDataDisplay";
import PaymentsDisplay from "./PaymentsDisplay";
import ProfileCreditComponent from "./ProfileCreditComponent";

export default function Profile() {
  return (
    <div className="h-full font-sans mx-auto w-[1420px] mt-10 flex gap-[60px] justify-between">
      <div className="w-full">
        <AuthDataDisplay />
        <ProfileCreditComponent />
      </div>
      <div className="w-full">
        <ProfileComponent />
        <PaymentsDisplay />
      </div>
    </div>
  );
}
