import React from "react";
import AboutCredits from "../../components/AboutCredits";

export default function AboutSection() {
  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <AboutCredits textColor="#ffffff" appVersion="5.5.1" />
    </div>
  );
}
