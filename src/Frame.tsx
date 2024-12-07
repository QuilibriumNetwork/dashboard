import React, { useCallback, useEffect, useState } from 'react';
import { binary_to_base58 } from "base58-js";
import { useVirtualizer } from '@tanstack/react-virtual';
import Loading from './Loading';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import { useNavigate, useParams } from 'react-router';

const Frame = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [init, setInit] = useState(false);
  const {filter, frameNumber} = useParams();
  const [frame, setFrame] = useState<{
    frameNumber: number,
    difficulty: number,
    outputs: any[],
    filter: string,
    timestamp: number,
    parentSelector: string,
    publicKeySignature: string,
    requests: any[],
    workers: {
      parallelism: bigint,
      ring: bigint,
      peerId: string,
    }[],
  }>();
  const parentFrameRef = React.useRef<HTMLDivElement>(null);
  const outputRef = React.useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [ringMap, setRingMap] = useState<{
    ring: number,
    workers: {
      name: string,
      parallelism: number,
    }[],
  }[]>([{ring: 0, workers: [{name:"foo", parallelism: 100}]}]);

  useEffect(() => {
    if (!init && filter && frameNumber) {
      setInit(false);
      (async () => {
        try {
          const r = await fetch("https://dashboard-api.quilibrium.com/frame/" + filter + "/" + frameNumber);
          const frame = await r.json();
          const workers = frame.requests.requests.filter((o: any) => o.Request.Mint?.proofs?.length > 0)
            .map((o: any, i: number) => {
              return {
                parallelism: BigInt("0x" + Buffer.from(o.Request.Mint.proofs[0], 'base64').toString('hex')).valueOf(),
                ring: BigInt("0x" + Buffer.from(o.Request.Mint.proofs[1], 'base64').toString('hex')).valueOf(),
                peerId: binary_to_base58(Buffer.from(o.Request.Mint.proofs[2], 'base64')),
              };
            }) as {
              parallelism: bigint,
              ring: bigint,
              peerId: string,
            }[];
          setFrame({
            frameNumber: frame.frameNumber,
            difficulty: frame.difficulty,
            outputs: frame.outputs.outputs,
            filter: frame.filter,
            timestamp: frame.timestamp,
            parentSelector: frame.parentSelector,
            publicKeySignature: frame.publicKeySignature,
            requests: frame.requests.requests,
            workers: workers,
          });
          let rings = [] as {
            ring: number,
            workers: {
              name: string,
              parallelism: number,
            }[],
          }[];
          for (const worker of workers) {
            if (!rings[Number(worker.ring)]) {
              rings[Number(worker.ring)] = {
                ring: Number(worker.ring),
                workers: [],
              }
            }

            let workerInfo = {
              parallelism: Number(worker.parallelism),
              name: worker.peerId,
            };
            rings[Number(worker.ring)].workers.push(workerInfo);
          }
          setLoading(false);
          setRingMap(rings);
        } catch {
        }
      })();
    }
  }, [filter, frameNumber, init])

  const requestRowVirtualizer = useVirtualizer({
    count: frame?.requests?.length ?? 0,
    getScrollElement: () => parentFrameRef.current,
    estimateSize: () => 24,
  });

  const outputRowVirtualizer = useVirtualizer({
    count: frame?.outputs?.length ?? 0,
    getScrollElement: () => outputRef.current,
    estimateSize: () => 24,
  });

  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }:{ cx: number, cy: number, midAngle: number, innerRadius: number, outerRadius: number, percent: number }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos((-midAngle) * RADIAN);
    const y = cy + radius * Math.sin((-midAngle) * RADIAN);

    return (
      percent > 0.05 ?
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text> : <text></text>
    );
  }

  return (
    <>
    <div className="grid grid-cols-1 px-8 md:grid-cols-2 gap-8 lg:grid-cols-3">
      <div className="flex flex-col bg-slate-100/20 p-4 rounded-xl grow">
        <div className="text-xl text-white">Frame Number</div>
        <div className="text-white text-3xl">
          {!loading && !error && frame && <span>{frame.frameNumber.toLocaleString()}</span>}
          {loading && <Loading/>}
          {error && <>An error occurred, please refresh.</>}
        </div>
      </div>
      <div className="flex flex-col bg-slate-100/20 p-4 rounded-xl grow">
        <div className="text-xl text-white">Difficulty</div>
        <div className="text-white text-3xl">
          {!loading && !error && frame && <span>{frame.difficulty.toLocaleString()}</span>}
          {loading && <Loading/>}
          {error && <>An error occurred, please refresh.</>}
        </div>
      </div>
      <div className="flex flex-col bg-slate-100/20 p-4 rounded-xl grow">
        <div className="text-xl text-white">Total Workers</div>
        <div className="text-white text-3xl">
          {!loading && !error && frame && <span>{(frame.workers.reduce((a,b) => a + b.parallelism, BigInt(0).valueOf())).toLocaleString()}</span>}
          {loading && <Loading/>}
          {error && <>An error occurred, please refresh.</>}
        </div>
      </div>
    </div>
    <div className="flex flex-col text-white mt-8 mx-8 bg-slate-100/20 p-4 rounded-xl">
      <div className="text-xl">Transactions</div>
      {loading && <Loading/>}
      <div className="grid grid-cols-5 pt-4 pl-4">
        <div className="flex flex-col">Type</div>
        <div className="flex flex-col">Timestamp</div>
        <div className="flex flex-col col-span-3">Public Key</div>
      </div>
      <div
        ref={parentFrameRef}
        className="flex flex-grow h-[270px] text-xs"
        style={{
          overflow: 'auto', // Make it scroll!
        }}
      >
        {/* The large inner element to hold all of the items */}
        <div
          style={{
            height: `${requestRowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {frame && requestRowVirtualizer.getVirtualItems().map((virtualItem) => {
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
              onClick={() => navigate("/tx/" + filter + "/" + frameNumber + "/" + virtualItem.index)}
              className={"hover:bg-slate-200/20 hover:cursor-pointer rounded-xl pt-1 pl-4"}
            >
              <div className="grid grid-cols-5">
                <div className="flex flex-col">
                  <code>{Object.keys(frame.requests[virtualItem.index].Request)[0]}</code>
                </div>
                <div className="flex flex-col">
                  <code>{new Date(frame.requests[virtualItem.index].timestamp ?? frame.timestamp).toLocaleDateString()} {new Date(frame.requests[virtualItem.index].timestamp ?? frame.timestamp).toLocaleTimeString()}</code>
                </div>
                <div className="flex flex-col col-span-3">
                  <code>0x{Buffer.from((
                    frame.requests[virtualItem.index].Request[Object.keys(frame.requests[virtualItem.index].Request)[0]].signature ||
                    frame.requests[virtualItem.index].Request[Object.keys(frame.requests[virtualItem.index].Request)[0]].public_key_signature_ed448
                  ).public_key.key_value, 'base64').toString('hex')}</code>
                </div>
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
    <div className="flex flex-col text-white mt-8 mx-8 bg-slate-100/20 p-4 rounded-xl">
      <div className="text-xl">Outputs</div>
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
            height: `${outputRowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {frame && outputRowVirtualizer.getVirtualItems().map((virtualItem) => {
            const t = Object.keys(frame.outputs[virtualItem.index].Output)[0];
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
              onClick={() => navigate("/tx/" + filter + "/" + frameNumber + "/" + virtualItem.index)}
              className={"hover:bg-slate-200/20 hover:cursor-pointer rounded-xl pt-1 pl-4"}
            >
              <div className="grid grid-cols-5">
                <div className="flex flex-col">
                  <code>{t}</code>
                </div>
                <div className="flex flex-col col-span-2 truncate">
                  <code className="text-ellipsis">{t === "Coin" ?
                    `${(Number(BigInt("0x"+Buffer.from(frame.outputs[virtualItem.index].Output[t].amount, 'base64').toString('hex')))/8000000000)} QUIL` :
                    t === "DeletedCoin" ?
                    "0x" + Buffer.from(frame.outputs[virtualItem.index].Output[t].address, 'base64').toString('hex') :
                    t === "Announce" ?
                    "0x" + Buffer.from(frame.outputs[virtualItem.index].Output[t].public_key_signatures_ed448[0].public_key.key_value, 'base64').toString('hex') :
                    t === "Join" ?
                    "0x" + Buffer.from(frame.outputs[virtualItem.index].Output[t].public_key_signature_ed448.public_key.key_value, 'base64').toString('hex') :
                    t === "Pause" ?
                    "0x" + Buffer.from(frame.outputs[virtualItem.index].Output[t].public_key_signature_ed448.public_key.key_value, 'base64').toString('hex') :
                    t === "Resume" ?
                    "0x" + Buffer.from(frame.outputs[virtualItem.index].Output[t].public_key_signature_ed448.public_key.key_value, 'base64').toString('hex') :
                    ""
                  }</code>
                </div>
                <div className="flex flex-col col-span-2">
                  <code>{frame.outputs[virtualItem.index].Output[t].owner?.Account?.ImplicitAccount?.address && "0x" + Buffer.from(
                    frame.outputs[virtualItem.index].Output[t].owner?.Account?.ImplicitAccount?.address,
                    'base64',
                  ).toString('hex')}</code>
                </div>
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
    <div className="flex flex-col text-white mt-8 mx-8 bg-slate-100/20 p-4 rounded-xl">
      <div className="text-xl pb-4">Worker Distribution</div>
      <div className="h-[100vh]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart width={400} height={400}>
          {ringMap.map(ring => <Pie key={`pie-${ring.ring}`} data={ring.workers} dataKey="parallelism" cx="50%" cy="50%" innerRadius={ring.ring*(400/ringMap.length) + (ring.ring ? 10 : 0)} outerRadius={(ring.ring+1)*(400/ringMap.length)} fill="#FF0271" labelLine={false} label={renderCustomizedLabel}>
            {
              ring.workers.map((entry, index) => (
                <Cell key={`cell-${ring.ring}-${index}`} strokeWidth={0.1}/>
              ))
            }
            </Pie>)}
        </PieChart>
      </ResponsiveContainer>
      </div>
    </div>
    </>
  );
}

export default Frame;