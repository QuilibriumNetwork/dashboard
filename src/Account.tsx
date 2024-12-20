import React, { useEffect, useMemo, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import Loading from './Loading';
import { useNavigate, useParams } from 'react-router';

const Account = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [init, setInit] = useState(false);
  const [coins, setCoins] = useState<{
    address: string;
    amount: string;
    details: any;
  }[]>([]);
  const {account} = useParams();
  const navigate = useNavigate();
  const outputRef = React.useRef<HTMLDivElement>(null);
  let bridge = "1ac3290d57e064bdb5a57e874b59290226a9f9730d69f1d963600883789d6ee2";
  const [selected, setSelected] = useState(["unmoved", "transfer", "merge", "split"]);

  useEffect(() => {
    if (!init && account) {
      setInit(true);
      (async () => {
        try {
          const resp = await fetch("https://dashboard-api.quilibrium.com/coins", {
            method: 'POST',
            body: JSON.stringify({
              "address": "0x" + account,
            }),
          });
          let coins = (await resp.json()).coins.map((c: any) => {
            return {
              address: c.address,
              amount: c.amount,
              details: c.details ? JSON.parse(c.details) : undefined,
            }
          });
          
          setCoins(coins);
          setLoading(false);
        } catch {
        }
      })();
    }
  }, [account, init]);

  const filteredCoins = useMemo(() => {
    return coins.filter(c => (selected.includes("unmoved") && c.details === undefined) || (c.details && selected.includes(c.details.type)));
  }, [coins, selected]);

  const coinOutputRowVirtualizer = useVirtualizer({
    count: filteredCoins?.length ?? 0,
    getScrollElement: () => outputRef.current,
    estimateSize: (e) => 24,
  });

  const renderCoinStatus = (request: any) => {
    switch (request.type) {
      case "transfer":
        return <div className="flex flex-row" onClick={()=>{ navigate("/account/" + Buffer.from(request.details.recipientAddress, 'base64').toString('hex')); setInit(false); setLoading(true); }}>
          <div className="">{Buffer.from(request.details.recipientAddress, 'base64').toString('hex') == bridge ? "Bridged:" : "Transfer:"}</div><code>0x{Buffer.from(request.details.recipientAddress, 'base64').toString('hex')}</code>
        </div>;
      case "split":
        return <div className="flex flex-col">
          <div className="">Split</div>
        </div>;
      case "merge":
        return <div className="flex flex-row">
          <div className="">Merged</div>
        </div>;
    }
    return <></>;
  }

  return (
    <>
    <div className="grid grid-cols-1 px-8 md:grid-cols-2 gap-8 lg:grid-cols-3">
      <div className="flex flex-col bg-slate-100/20 p-4 rounded-xl grow col-span-2">
        <div className="text-xl text-white">Account</div>
        <div className="text-white text-xl">
          {!loading && !error && coins && <span>0x{account}</span>}
          {loading && <Loading/>}
          {error && <>An error occurred, please refresh.</>}
        </div>
      </div>
      <div className="flex flex-col bg-slate-100/20 p-4 rounded-xl grow">
        <div className="text-xl text-white">Objects (incl. historic)</div>
        <div className="text-white text-3xl">
          {!loading && !error && coins && <span>{coins.length}</span>}
          {loading && <Loading/>}
          {error && <>An error occurred, please refresh.</>}
        </div>
      </div>
    </div>
    <div className="flex flex-col text-white mt-8 mx-8 bg-slate-100/20 p-4 rounded-xl">
      <div className="flex flex-row justify-between">
        <div className="text-xl">Historic Coins</div>
        <div className="flex flex-row">
          <div className="py-1 ml-2 ">Show:</div>
          <div onClick={() => setSelected(prev => prev.includes("unmoved") ? prev.filter(m => m !== "unmoved") : [...prev, "unmoved"])} className={"rounded-full cursor-pointer px-4 py-1 ml-2 " + (selected.includes("unmoved") ? "bg-white text-black" : " border border-white")}>Unmoved</div>
          <div onClick={() => setSelected(prev => prev.includes("transfer") ? prev.filter(m => m !== "transfer") : [...prev, "transfer"])} className={"rounded-full cursor-pointer px-4 py-1 ml-2 " + (selected.includes("transfer") ? "bg-white text-black" : " border border-white")}>Transferred</div>
          <div onClick={() => setSelected(prev => prev.includes("merge") ? prev.filter(m => m !== "merge") : [...prev, "merge"])} className={"rounded-full cursor-pointer px-4 py-1 ml-2 " + (selected.includes("merge") ? "bg-white text-black" : " border border-white")}>Merged</div>
          <div onClick={() => setSelected(prev => prev.includes("split") ? prev.filter(m => m !== "split") : [...prev, "split"])} className={"rounded-full cursor-pointer px-4 py-1 ml-2 " + (selected.includes("split") ? "bg-white text-black" : " border border-white")}>Split</div>
        </div>
      </div>
      {loading && <Loading/>}
      <div className="grid grid-cols-5 pt-4 pl-4">
        <div className="flex flex-col col-span-2">Address</div>
        <div className="flex flex-col">Amount</div>
        <div className="flex flex-col col-span-2">Status</div>
      </div>
      <div
        ref={outputRef}
        className="flex flex-grow h-[480px] text-xs"
        style={{
          overflow: 'auto', // Make it scroll!
        }}
      >
        {/* The large inner element to hold all of the items */}
        <div
          style={{
            height: `${coinOutputRowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {filteredCoins && coinOutputRowVirtualizer.getVirtualItems().map((virtualItem) => {
            return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
              className={"hover:bg-slate-200/20 hover:cursor-pointer rounded-xl pt-1 pl-4"}
              onClick={() => {
              }}
            >
              <div className="grid grid-cols-5">
                <div className="flex flex-col col-span-2">
                  <code>{filteredCoins[virtualItem.index].address}</code>
                </div>
                <div className="flex flex-col truncate">
                  <code className="text-ellipsis">{filteredCoins[virtualItem.index].amount}</code>
                </div>
                <div className="flex flex-col col-span-2">
                  {filteredCoins[virtualItem.index].details && renderCoinStatus(filteredCoins[virtualItem.index].details)}
                </div>
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
    </>
  );
}

export default Account;