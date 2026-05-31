import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PersonalIDE } from "@/components/chat/PersonalIDE";
import { SEOHead } from "@/components/SEOHead";
import { PAGE_SEO } from "@/lib/seo";
import { loadIdePayload } from "@/lib/idePayloadStorage";

const IdePage = () => {
  const navigate = useNavigate();

  const [payload] = useState(() => loadIdePayload());

  const initialCode = payload?.code;
  const language = payload?.language ?? "javascript";

  const handleClose = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate("/chatbot");
  };

  return (
    <>
      <SEOHead meta={PAGE_SEO.ide} />
      <div className="min-h-[100dvh] bg-background">
        <PersonalIDE
          initialCode={initialCode}
          language={language}
          onClose={handleClose}
          defaultOutputPanel="preview"
        />
      </div>
    </>
  );
};

export default IdePage;
