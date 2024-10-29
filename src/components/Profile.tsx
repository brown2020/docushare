"use client";

import ProfileComponent from "./ProfileComponent";
import AuthDataDisplay from "./AuthDataDisplay";
import PaymentsDisplay from "./PaymentsDisplay";
import ProfileCreditComponent from "./ProfileCreditComponent";

export default function Profile() {
  return (
    <div className="h-full font-sans mx-auto w-full p-5 flex flex-col md:flex-row gap-5 justify-between max-sm:mt-5">
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
