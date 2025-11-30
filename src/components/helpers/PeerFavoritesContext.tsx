import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface FavoritePeer {
  peerId: string;
  label?: string; // Optional label/alias for the peer
}

interface PeerFavoritesContextType {
  favorites: FavoritePeer[];
  addFavorite: (peerId: string, label?: string) => void;
  removeFavorite: (peerId: string) => void;
  updateFavorite: (peerId: string, label?: string) => void;
  isFavorite: (peerId: string) => boolean;
  getFavorite: (peerId: string) => FavoritePeer | undefined;
}

const STORAGE_KEY = "peer_favorites";

const PeerFavoritesContext = createContext<PeerFavoritesContextType | undefined>(undefined);

export function PeerFavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoritePeer[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as FavoritePeer[];
        setFavorites(parsed);
      }
    } catch (err) {
      console.error("Failed to load peer favorites from localStorage:", err);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (err) {
      console.error("Failed to save peer favorites to localStorage:", err);
    }
  }, [favorites]);

  const addFavorite = (peerId: string, label?: string) => {
    setFavorites((prev) => {
      // Check if already exists
      if (prev.some((f) => f.peerId === peerId)) {
        return prev;
      }
      return [...prev, { peerId, label }];
    });
  };

  const removeFavorite = (peerId: string) => {
    setFavorites((prev) => prev.filter((f) => f.peerId !== peerId));
  };

  const updateFavorite = (peerId: string, label?: string) => {
    setFavorites((prev) =>
      prev.map((f) => (f.peerId === peerId ? { ...f, label } : f))
    );
  };

  const isFavorite = (peerId: string) => {
    return favorites.some((f) => f.peerId === peerId);
  };

  const getFavorite = (peerId: string) => {
    return favorites.find((f) => f.peerId === peerId);
  };

  return (
    <PeerFavoritesContext.Provider
      value={{
        favorites,
        addFavorite,
        removeFavorite,
        updateFavorite,
        isFavorite,
        getFavorite,
      }}
    >
      {children}
    </PeerFavoritesContext.Provider>
  );
}

export function usePeerFavorites() {
  const context = useContext(PeerFavoritesContext);
  if (context === undefined) {
    throw new Error("usePeerFavorites must be used within a PeerFavoritesProvider");
  }
  return context;
}

