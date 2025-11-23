import { Helmet } from "react-helmet-async";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useNavbarVariant } from "@/components/helpers/NavbarContext";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  const { setVariant } = useNavbarVariant();

  useEffect(() => {
    setVariant("solid"); // or "transparent", "transparent-burgundy"
    return () => setVariant(undefined); // reset on unmount
  }, [setVariant]);

  return (
    <>
      <Helmet>
        <title>404 – Off the Quilibrium Grid</title>
        <meta
          name="description"
          content="The page you’re looking for doesn’t exist in this sector. It might’ve been decommissioned, renamed, or warped elsewhere."
        />
        <meta property="og:title" content="404 – Off the Quilibrium Grid" />
        <meta
          property="og:description"
          content="The page you’re looking for doesn’t exist in this sector. It might’ve been decommissioned, renamed, or warped elsewhere."
        />
        <meta property="og:image" content="/images/socialcard.png" />
        <meta property="og:url" content="https://www.quilibrium.com" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="404 – Off the Quilibrium Grid" />
        <meta
          name="twitter:description"
          content="The page you’re looking for doesn’t exist in this sector. It might’ve been decommissioned, renamed, or warped elsewhere."
        />
        <meta name="twitter:image" content="/images/socialcard.png" />
      </Helmet>
      <section className="min-h-screen flex flex-col justify-center items-center bg-light-pink text-burgundy text-center px-4">
        <div className="max-w-xl w-full">
          <h1 className="gradient-sweep pb-1 lg:text-8xl">404</h1>
          <h2 className="text-burgundy mb-4">
            You’ve Drifted Outside the Quilibrium
          </h2>
          <p className="mt-4 text-lg">
            The page you’re looking for doesn’t exist in this sector. It
            might’ve been decommissioned, renamed, or warped elsewhere.
          </p>
          <Button asChild variant="primary" className="mt-6">
            <Link to="/">Go Home</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
