import React from "react";
import { Shield } from "lucide-react";

// Official HubSphere Release Strategy Constants
export const BRAND_CONFIG = {
  VERSION_NAME: "HubSphere V1",
  VERSION_SHORT: "V1",
  INTEGRATED_ERP_ENV: "Integrated ERP Environment",
  TAGLINE: "One Platform. Complete Business Management.",
  HUBSPHERE_HQ: "HubSphere HQ",
};

interface LogoProps {
  theme?: "light" | "dark" | "all-white" | "orange-black" | "orange-white";
  className?: string;
  textSizeClassName?: string;
  withIcon?: boolean;
  iconClassName?: string;
}

/**
 * Centered, responsive HubSphere Logo component following precise enterprise guidelines.
 * Hub = Orange
 * Sphere = Black (on light backgrounds) / White (on dark backgrounds)
 */
export const Logo: React.FC<LogoProps> = ({
  theme = "dark",
  className = "",
  textSizeClassName = "text-2xl sm:text-3xl",
  withIcon = true,
  iconClassName = "w-6 h-6",
}) => {
  // Hub = Always Orange (#f97316)
  const hubColorClass = "text-[#f97316]";
  
  // Sphere = Black (on light background) / White (on dark background)
  let sphereColorClass = "text-white";
  if (theme === "light" || theme === "orange-black") {
    sphereColorClass = "text-slate-900";
  } else if (theme === "all-white") {
    sphereColorClass = "text-white";
  }

  return (
    <div className={`inline-flex items-center gap-2.5 font-sans ${className}`}>
      {withIcon && (
        <div className="bg-orange-500/10 border border-orange-500/20 p-2 rounded-xl text-orange-500 flex items-center justify-center shrink-0">
          <Shield className={`${iconClassName} fill-orange-500/15`} />
        </div>
      )}
      <h1 className={`${textSizeClassName} font-black tracking-tight leading-none`}>
        {theme === "all-white" ? (
          <span className="text-white">HubSphere</span>
        ) : (
          <>
            <span className={hubColorClass}>Hub</span>
            <span className={sphereColorClass}>Sphere</span>
          </>
        )}
      </h1>
    </div>
  );
};

interface VersionBadgeProps {
  className?: string;
}

export const VersionBadge: React.FC<VersionBadgeProps> = ({ className = "" }) => {
  return (
    <span className={`inline-flex items-center bg-orange-500/10 hover:bg-orange-500/15 text-orange-500 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase border border-orange-500/20 shadow-sm transition-colors ${className}`}>
      {BRAND_CONFIG.VERSION_NAME}
    </span>
  );
};

interface TaglineBlockProps {
  theme?: "light" | "dark";
  className?: string;
}

export const TaglineBlock: React.FC<TaglineBlockProps> = ({ theme = "dark", className = "" }) => {
  const isDark = theme === "dark";
  return (
    <div className={`space-y-1.5 ${className}`}>
      <p className={`text-xs font-extrabold uppercase tracking-widest ${isDark ? "text-slate-300" : "text-slate-700"}`}>
        {BRAND_CONFIG.INTEGRATED_ERP_ENV}
      </p>
      <p className={`text-xs font-semibold ${isDark ? "text-slate-400" : "text-slate-500"}`}>
        {BRAND_CONFIG.TAGLINE}
      </p>
    </div>
  );
};
