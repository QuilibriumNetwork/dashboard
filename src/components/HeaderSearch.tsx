import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { explorerApi, PeerRecord } from "@/lib/api";
import { formatPeerRows, matchesSearch, PeerRow } from "@/lib/peers";
import Magnifyingglass from "@/assets/icons/iconset/Magnifyingglass";

interface SearchResult {
  type: "peer" | "frame";
  peer?: PeerRow;
  frameNumber?: number;
  displayText: string;
  subtitle?: string;
}

interface HeaderSearchProps {
  fullWidth?: boolean;
}

export function HeaderSearch({ fullWidth = false }: HeaderSearchProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [peers, setPeers] = useState<PeerRow[]>([]);
  const [latestFrameNumber, setLatestFrameNumber] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  const isActive = isFocused || query.trim().length > 0;

  // Load peers and latest frame number
  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const [peerRecords, latestFrame] = await Promise.all([
          explorerApi.getPeers(),
          explorerApi.getLatestFrame(),
        ]);
        if (mounted) {
          setPeers(formatPeerRows(peerRecords));
          setLatestFrameNumber(latestFrame.header.frameNumber);
        }
      } catch (err) {
        console.error("Failed to load search data:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Generate search results
  const searchResults = useMemo<SearchResult[]>(() => {
    if (!query.trim() || loading) return [];

    const trimmedQuery = query.trim().toLowerCase();
    const results: SearchResult[] = [];

    // Check if query looks like an IP address (contains dots or colons)
    const looksLikeIP = trimmedQuery.includes(".") || trimmedQuery.includes(":");

    // Only check for frame numbers if it doesn't look like an IP address
    if (!looksLikeIP) {
      const frameNum = parseInt(trimmedQuery, 10);
      if (!isNaN(frameNum) && frameNum > 0) {
        results.push({
          type: "frame",
          frameNumber: frameNum,
          displayText: `Frame #${frameNum}`,
          subtitle: "View frame details",
        });
      }
    }

    // Search peers
    const matchingPeers = peers.filter((peer) => matchesSearch(peer, trimmedQuery));
    for (const peer of matchingPeers) {
      // Extract IP addresses for display
      const allAddresses = [...peer.pubsub, ...peer.stream];
      const ipAddresses: string[] = [];
      for (const addr of allAddresses) {
        const ip4Match = addr.match(/\/ip4\/([^/]+)/);
        const ip6Match = addr.match(/\/ip6\/([^/]+)/);
        if (ip4Match) ipAddresses.push(ip4Match[1]);
        if (ip6Match) ipAddresses.push(ip6Match[1]);
      }
      const ipDisplay = ipAddresses.length > 0 ? ipAddresses[0] : "No IP address";

      results.push({
        type: "peer",
        peer,
        displayText: peer.peerId.slice(0, 20) + (peer.peerId.length > 20 ? "..." : ""),
        subtitle: ipDisplay,
      });
    }

    return results;
  }, [query, peers, latestFrameNumber, loading]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchResults.length]);

  const handleSelect = (result: SearchResult) => {
    if (result.type === "peer" && result.peer) {
      navigate(`/peers/${result.peer.peerId}`);
    } else if (result.type === "frame" && result.frameNumber !== undefined) {
      navigate(`/frames/${result.frameNumber}`);
    }
    setQuery("");
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current && dropdownRef.current) {
      const dropdown = dropdownRef.current;
      const selectedItem = selectedItemRef.current;
      const dropdownRect = dropdown.getBoundingClientRect();
      const itemRect = selectedItem.getBoundingClientRect();

      if (itemRect.bottom > dropdownRect.bottom) {
        selectedItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      } else if (itemRect.top < dropdownRect.top) {
        selectedItem.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    }
  }, [selectedIndex, showDropdown]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown || searchResults.length === 0) {
      if (e.key === "Enter" && searchResults.length > 0) {
        handleSelect(searchResults[0]);
      } else if (e.key === "Escape") {
        setShowDropdown(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % searchResults.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
        break;
      case "Enter":
        e.preventDefault();
        if (searchResults[selectedIndex]) {
          handleSelect(searchResults[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setShowDropdown(false);
        inputRef.current?.blur();
        break;
      case "Tab":
        // Allow Tab to navigate through results
        if (e.shiftKey) {
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + searchResults.length) % searchResults.length);
        } else {
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % searchResults.length);
        }
        break;
    }
  };

  return (
    <div className={`relative transition-all duration-200 ${fullWidth ? 'w-full' : isActive ? 'flex-1 max-w-2xl' : 'w-64'}`} ref={searchRef}>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-burgundy/40 dark:text-white/40">
          <Magnifyingglass className="h-4 w-4" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            if (query.trim() && searchResults.length > 0) {
              setShowDropdown(true);
            }
          }}
          onBlur={() => {
            setIsFocused(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search IP, peer, or frame..."
          className="w-full rounded-lg border border-burgundy/20 bg-white/50 px-10 py-2 text-sm text-burgundy placeholder:text-burgundy/40 focus:border-burgundy/40 focus:bg-white focus:outline-none focus:ring-2 focus:ring-burgundy/20 dark:border-white/20 dark:bg-[#1a0f27]/50 dark:text-white dark:placeholder:text-white/40 dark:focus:border-white/40 dark:focus:bg-[#1a0f27] dark:focus:ring-white/20"
        />
        {query && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {showDropdown && searchResults.length > 0 && (
              <span className="text-xs text-burgundy/60 dark:text-white/60 font-medium">
                Results ({searchResults.length})
              </span>
            )}
            <button
              onClick={() => {
                setQuery("");
                setShowDropdown(false);
                inputRef.current?.focus();
              }}
              className="flex items-center justify-center w-6 h-6 text-burgundy/60 hover:text-burgundy dark:text-white/60 dark:hover:text-white transition-colors rounded hover:bg-burgundy/10 dark:hover:bg-white/10"
              aria-label="Clear search"
            >
              <span className="text-lg leading-none">×</span>
            </button>
          </div>
        )}
      </div>

      {showDropdown && searchResults.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-50 mt-2 max-h-96 overflow-y-auto rounded-lg border border-burgundy/20 bg-white shadow-lg dark:border-white/20 dark:bg-[#1a0f27]"
        >
          {searchResults.map((result, index) => (
            <button
              key={index}
              ref={index === selectedIndex ? selectedItemRef : null}
              onClick={() => handleSelect(result)}
              className={`w-full px-4 py-3 text-left transition-colors border-b border-burgundy/10 dark:border-white/10 last:border-b-0 ${
                index === selectedIndex
                  ? "bg-burgundy/20 dark:bg-white/20"
                  : "hover:bg-burgundy/10 dark:hover:bg-white/10"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-burgundy dark:text-white truncate">
                    {result.displayText}
                  </div>
                  {result.subtitle && (
                    <div className="text-xs text-burgundy/60 dark:text-white/60 truncate mt-0.5">
                      {result.subtitle}
                    </div>
                  )}
                </div>
                <div className="ml-2 text-xs font-semibold uppercase tracking-wider text-burgundy/40 dark:text-white/40">
                  {result.type === "peer" ? "PEER" : "FRAME"}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

