import { Plus_Jakarta_Sans } from "next/font/google";

/**
 * The single place the application's typeface is defined.
 *
 * The design calls for Satoshi, which ships from Fontshare rather than Google
 * Fonts. Plus Jakarta Sans stands in for it: the same geometric skeleton, tall
 * x-height and low stroke contrast, self-hosted by `next/font` so there is no
 * external request and no layout shift.
 *
 * To switch to the real family, drop `Satoshi-Variable.woff2` into `app/fonts/`
 * and replace the export below:
 *
 *   import localFont from "next/font/local";
 *
 *   export const displayFont = localFont({
 *     src: "../app/fonts/Satoshi-Variable.woff2",
 *     variable: "--font-display",
 *     display: "swap",
 *   });
 *
 * Nothing else in the codebase needs to change — `--font-display` is consumed by
 * the `--font-sans` token in app/globals.css.
 */
export const displayFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});
