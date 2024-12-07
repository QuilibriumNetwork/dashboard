import React, { useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import Loading from './Loading';
import { useParams } from 'react-router';

const Tx = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [init, setInit] = useState(false);
  const {filter, frameNumber, seqNo} = useParams();
  const [tx, setTx] = useState<{
    addresses: string[],
    deletedAddresses: {address: string, frameNumber: number}[],
    outputs: any[],
    request: any,
  }>();
  const outputRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!init && filter && frameNumber) {
      setInit(false);
      (async () => {
        try {
          const r = await fetch("https://dashboard-api.quilibrium.com/tx/" + filter + "/" + frameNumber +"/" + seqNo);
          const tx = await r.json();
          setTx(tx);
          setLoading(false);
        } catch {
        }
      })();
    }
  }, [filter, frameNumber, init])

  const txOutputRowVirtualizer = useVirtualizer({
    count: tx?.outputs?.length ?? 0,
    getScrollElement: () => outputRef.current,
    estimateSize: () => 24,
  });

  const renderTxRequest = (request: any) => {
    switch (Object.keys(request)[0]) {
      case "Transfer":
        return <>
        <div className="grid grid-cols-5">
          <div className="flex flex-col">To Account:</div>
          <code className="flex flex-col col-span-4">0x{Buffer.from(request.Transfer.to_account.Account.ImplicitAccount.address, 'base64').toString('hex')}</code>
        </div>
        <div className="grid grid-cols-5">
          <div className="flex flex-col">Of Coin:</div>
          <code className="flex flex-col col-span-4">0x{Buffer.from(request.Transfer.of_coin.address, 'base64').toString('hex')}</code>
        </div>
        <div className="grid grid-cols-5">
          <div className="flex flex-col">Signature:</div>
          <code className="flex flex-col break-words col-span-4">0x{Buffer.from(request.Transfer.signature.signature, 'base64').toString('hex')}</code>
        </div>
        </>;
      case "Mint":
        return <>
          {request.Mint.proofs.map((c: any, i: number) => {
          return <div key={"mint-" + i} className="grid grid-cols-5">
            <div className="flex flex-col">{i === 0 ? "Commitment:" : i === 1 ? "Parallelism:" : i === 2 ? "Frame Number:" : (i >= 3 && i <= request.Mint.proofs.length - 3) ? "Merkle Proof:" : i === request.Mint.proofs.length - 2 ? "Path:" : "Wesolowski Proof:"}</div>
            <code className="flex flex-col break-words col-span-4">0x{Buffer.from(c, 'base64').toString('hex')}</code>
          </div>;
          })}
          <div className="grid grid-cols-5">
            <div className="flex flex-col">Signature:</div>
            <code className="flex flex-col break-words col-span-4">0x{Buffer.from(request.Mint.signature.signature, 'base64').toString('hex')}</code>
          </div>
        </>;
      case "Join":
        return <>
        <div className="grid grid-cols-5">
          <div className="flex flex-col">Signature:</div>
          <code className="flex flex-col break-words col-span-4">0x{Buffer.from(request.Join.public_key_signature_ed448.signature, 'base64').toString('hex')}</code>
        </div>
        </>;
      case "Announce":
        return <>
        <div className="grid grid-cols-5">
          <div className="flex flex-col">Signature:</div>
          <code className="flex flex-col break-words col-span-4">0x{Buffer.from(request.Announce.public_key_signatures_ed448[0].signature, 'base64').toString('hex')}</code>
        </div>
        </>;
      case "Merge":
        return <>
        {request.Merge.coins.map((c: any, i: number) => {
        return <div key={"merge-" + i} className="grid grid-cols-5">
          <div className="flex flex-col">Coin:</div>
          <code className="flex flex-col col-span-4">0x{Buffer.from(c.address, 'base64').toString('hex')}</code>
        </div>;
        })}
        <div className="grid grid-cols-5">
          <div className="flex flex-col">Signature:</div>
          <code className="flex flex-col break-words col-span-4">0x{Buffer.from(request.Merge.signature.signature, 'base64').toString('hex')}</code>
        </div>
        </>;
      case "Split":
        return <>
        <div className="grid grid-cols-5">
          <div className="flex flex-col">Of Coin:</div>
          <code className="flex flex-col col-span-4">0x{Buffer.from(request.Split.of_coin.address, 'base64').toString('hex')}</code>
        </div>
        {request.Split.amounts.map((c: any, i: number) => {
        return <div key={"split-" + i} className="grid grid-cols-5">
          <div className="flex flex-col">Amount:</div>
          <code className="flex flex-col col-span-4">{((Number(BigInt("0x"+Buffer.from(c, 'base64').toString('hex'))))/8000000000).toLocaleString()} QUIL</code>
        </div>;
        })}
        <div className="grid grid-cols-5">
          <div className="flex flex-col">Signature:</div>
          <code className="flex flex-col break-words col-span-4">0x{Buffer.from(request.Split.signature.signature, 'base64').toString('hex')}</code>
        </div>
        </>;
      case "Leave":
        return <>
        <div className="grid grid-cols-5">
          <div className="flex flex-col">Signature:</div>
          <code className="flex flex-col break-words col-span-4">0x{Buffer.from(request.Leave.public_key_signature_ed448.signature, 'base64').toString('hex')}</code>
        </div>
        </>;
      case "Pause":
        return <>
        <div className="grid grid-cols-5">
          <div className="flex flex-col">Signature:</div>
          <code className="flex flex-col break-words col-span-4">0x{Buffer.from(request.Pause.public_key_signature_ed448.signature, 'base64').toString('hex')}</code>
        </div>
        </>;
      case "Resume":
        return <>
        <div className="grid grid-cols-5">
          <div className="flex flex-col">Signature:</div>
          <code className="flex flex-col break-words col-span-4">0x{Buffer.from(request.Resume.public_key_signature_ed448.signature, 'base64').toString('hex')}</code>
        </div>
        </>;
    }
    return <></>;
  }

  return (
    <>
    <div className="grid grid-cols-1 px-8 md:grid-cols-2 gap-8 lg:grid-cols-3">
      <div className="flex flex-col bg-slate-100/20 p-4 rounded-xl grow">
        <div className="text-xl text-white">Frame Number</div>
        <div className="text-white text-3xl">
          {!loading && !error && tx && <span>{parseInt(frameNumber ?? "0", 10).toLocaleString()}</span>}
          {loading && <Loading/>}
          {error && <>An error occurred, please refresh.</>}
        </div>
      </div>
      <div className="flex flex-col bg-slate-100/20 p-4 rounded-xl grow">
        <div className="text-xl text-white">Sequence Number</div>
        <div className="text-white text-3xl">
          {!loading && !error && tx && <span>{seqNo}</span>}
          {loading && <Loading/>}
          {error && <>An error occurred, please refresh.</>}
        </div>
      </div>
      <div className="flex flex-col bg-slate-100/20 p-4 rounded-xl grow">
        <div className="text-xl text-white">Timestamp</div>
        <div className="text-white text-3xl">
          {!loading && !error && tx && <span>{new Date(tx?.request.timestamp).toLocaleDateString()} {new Date(tx?.request.timestamp).toLocaleTimeString()}</span>}
          {loading && <Loading/>}
          {error && <>An error occurred, please refresh.</>}
        </div>
      </div>
    </div>
    <div className="flex flex-col text-white mt-8 mx-8 bg-slate-100/20 p-4 rounded-xl">
      {tx && <div className="text-xl">{Object.keys(tx.request.Request)[0]}</div>}
      {tx && <div className="">{renderTxRequest(tx.request.Request)}</div>}
    </div>
    <div className="flex flex-col text-white mt-8 mx-8 bg-slate-100/20 p-4 rounded-xl">
      <div className="text-xl">Transaction Outputs</div>
      {loading && <Loading/>}
      <div className="grid grid-cols-5 pt-4 pl-4">
        <div className="flex flex-col">Type</div>
        <div className="flex flex-col col-span-2">Info</div>
        <div className="flex flex-col col-span-2">Owner Address</div>
      </div>
      <div
        ref={outputRef}
        className="flex flex-grow h-[270px] text-xs"
        style={{
          overflow: 'auto', // Make it scroll!
        }}
      >
        {/* The large inner element to hold all of the items */}
        <div
          style={{
            height: `${txOutputRowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {tx && txOutputRowVirtualizer.getVirtualItems().map((virtualItem) => {
            const t = Object.keys(tx.outputs[virtualItem.index].Output)[0];
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
            >
              <div className="grid grid-cols-5">
                <div className="flex flex-col">
                  <code>{t}</code>
                </div>
                <div className="flex flex-col col-span-2 truncate">
                  <code className="text-ellipsis">{t === "Coin" ?
                    `${(Number(BigInt("0x"+Buffer.from(tx.outputs[virtualItem.index].Output[t].amount, 'base64').toString('hex')))/8000000000)} QUIL` :
                    t === "DeletedCoin" ?
                    "0x" + Buffer.from(tx.outputs[virtualItem.index].Output[t].address, 'base64').toString('hex') :
                    t === "Announce" ?
                    "0x" + Buffer.from(tx.outputs[virtualItem.index].Output[t].public_key_signatures_ed448[0].public_key.key_value, 'base64').toString('hex') :
                    t === "Join" ?
                    "0x" + Buffer.from(tx.outputs[virtualItem.index].Output[t].public_key_signature_ed448.public_key.key_value, 'base64').toString('hex') :
                    t === "Pause" ?
                    "0x" + Buffer.from(tx.outputs[virtualItem.index].Output[t].public_key_signature_ed448.public_key.key_value, 'base64').toString('hex') :
                    t === "Resume" ?
                    "0x" + Buffer.from(tx.outputs[virtualItem.index].Output[t].public_key_signature_ed448.public_key.key_value, 'base64').toString('hex') :
                    ""
                  }</code>
                </div>
                <div className="flex flex-col col-span-2">
                  <code>{tx.outputs[virtualItem.index].Output[t].owner?.Account?.ImplicitAccount?.address && "0x" + Buffer.from(
                    tx.outputs[virtualItem.index].Output[t].owner?.Account?.ImplicitAccount?.address,
                    'base64',
                  ).toString('hex')}</code>
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

export default Tx;