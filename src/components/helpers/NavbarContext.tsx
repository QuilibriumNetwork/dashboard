import { createContext, useContext, useState } from "react";

type Variant = "transparent" | "solid" | "transparent-burgundy" | undefined;

const NavbarVariantContext = createContext<{
  variant: Variant;
  setVariant: (v?: Variant) => void;
}>({
  variant: "transparent",
  setVariant: () => {},
});

export const useNavbarVariant = () => useContext(NavbarVariantContext);

export const NavbarVariantProvider = ({ children }: { children: React.ReactNode }) => {
  const [variant, setVariant] = useState<Variant>("transparent");

  return (
    <NavbarVariantContext.Provider value={{ variant, setVariant }}>
      {children}
    </NavbarVariantContext.Provider>
  );
};
