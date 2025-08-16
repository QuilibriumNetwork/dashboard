import React, { useCallback, useEffect, useState } from 'react';
import { binary_to_base58 } from "base58-js";
import { useVirtualizer } from '@tanstack/react-virtual';
import Loading from './Loading';
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts';
import Callout from './Callout';

const PrimaryDashboard = () => {
  const [data, setData] = useState<{peer_info: {peer_id: string, multiaddrs: string[], max_frame: number, timestamp: number, version: string}[]}>();
  const [networkInfo, setNetworkInfo] = useState<{maxFrame: number; totalSupply: string}>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [init, setInit] = useState(false);
  const [loadingFrames, setLoadingFrames] = useState(true);
  const [frames, setFrames] = useState<{
    frameNumber: number,
    difficulty: number,
    outputs: number,
    filter: string,
    timestamp: number,
    parentSelector: string,
    publicKeySignature: string,
    requests: number,
    workers: {
      parallelism: bigint,
      ring: bigint,
      peerId: string,
    }[],
  }[]>();
  const parentRef = React.useRef<HTMLDivElement>(null);
  const parentFrameRef = React.useRef<HTMLDivElement>(null);
  const [ringMap, setRingMap] = useState<{
    ring: number,
    workers: {
      name: string,
      parallelism: number,
    }[],
  }[]>([{ring: 0, workers: [{name:"foo", parallelism: 100}]}]);
  const [cachedResponses, setCachedResponses] = useState<any>();

  useEffect(() => {
    if (loading && !init) {
      setInit(true);
      fetch('/frame_cache.json').then(async (data) => {

        setCachedResponses(await data.json());

      setData({
        "peer_info": [],
      });
      setNetworkInfo({
        "maxFrame": 244200,
        "totalSupply": "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkQSGY76Lrs="
      });
        setLoading(false);
      })
    }
  }, [init, loading]);

  useEffect(() => {
    if (networkInfo) {
      console.log(cachedResponses);
      let frames = [];
      for (let i = networkInfo.maxFrame-10; i <= networkInfo.maxFrame; i++) {
        try {
          const frame = cachedResponses[i.toString()];
          console.log(frame);
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
          frames.push({
            frameNumber: frame.frameNumber,
            difficulty: frame.difficulty,
            outputs: frame.outputs.outputs.length,
            filter: frame.filter,
            timestamp: frame.timestamp,
            parentSelector: frame.parentSelector,
            publicKeySignature: frame.publicKeySignature,
            requests: frame.requests.requests.length,
            workers: workers,
          });
          if (i === networkInfo.maxFrame-10) {
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
            setRingMap(rings);
          }
        } catch (e) {
          console.log(e);
        }
      }
      setFrames(frames.reverse());
      setLoadingFrames(false);
    }
  }, [networkInfo])

  const frameRowVirtualizer = useVirtualizer({
    count: frames?.length ?? 0,
    getScrollElement: () => parentFrameRef.current,
    estimateSize: () => 24,
  });

  const rowVirtualizer = useVirtualizer({
    count: data?.peer_info.length ?? 0,
    getScrollElement: () => parentRef.current,
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
    <div className="px-8 pb-4">
    <Callout type='warning' size='big'>The dashboard data is temporarily paused for upgrades, this data will be stale.</Callout>
    </div>
    <div className="grid grid-cols-1 px-8 md:grid-cols-2 gap-8 lg:grid-cols-4">
      <div className="flex flex-col bg-slate-100/20 p-4 rounded-xl grow">
        <div className="text-xl text-white">Current Frame</div>
        <div className="text-white text-3xl">
          {!loading && !error && networkInfo && <span>{networkInfo.maxFrame.toLocaleString()}</span>}
          {loading && <Loading/>}
          {error && <>An error occurred, please refresh.</>}
        </div>
      </div>
      <div className="flex flex-col bg-slate-100/20 p-4 rounded-xl grow">
        <div className="text-xl text-white">Total Supply</div>
        <div className="text-white text-3xl">
          {!loading && !error && networkInfo && <span>{(BigInt("0x" + Buffer.from(networkInfo.totalSupply, "base64").toString("hex")) / BigInt(8000000000)).toLocaleString()} QUIL</span>}
          {loading && <Loading/>}
          {error && <>An error occurred, please refresh.</>}
        </div>
      </div>
      <div className="flex flex-col bg-slate-100/20 p-4 rounded-xl grow">
        <div className="text-xl text-white">Estimated Daily Emissions</div>
        <div className="text-white text-3xl">
          {!loadingFrames && !error && frames && <span>{Math.floor(512*60*60*24/((frames[0].timestamp - frames[10].timestamp)/10000)).toLocaleString()} QUIL</span>}
          {loadingFrames && <Loading/>}
          {error && <>An error occurred, please refresh.</>}
        </div>
      </div>
      <div className="flex flex-col bg-slate-100/20 p-4 rounded-xl grow">
        <div className="text-xl text-white">Avg. Frame Duration</div>
        <div className="text-white text-3xl">
          {!loadingFrames && !error && frames && <span>{((frames[0].timestamp - frames[10].timestamp)/10000)} seconds</span>}
          {loadingFrames && <Loading/>}
          {error && <>An error occurred, please refresh.</>}
        </div>
      </div>
    </div>
    <div className="flex flex-col text-white mt-8 mx-8 bg-slate-100/20 p-4 rounded-xl">
      <div className="text-xl">Latest Frames</div>
      {loadingFrames && <Loading/>}
      <div className="grid grid-cols-4 pt-4 pl-4">
        <div className="flex flex-col">
          Frame Number
        </div>
        <div className="flex flex-col">Inputs</div>
        <div className="flex flex-col">Outputs</div>
        <div className="flex flex-col">Timestamp</div>
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
            height: `${frameRowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {/* Only the visible items in the virtualizer, manually positioned to be in view */}
          {frames && frameRowVirtualizer.getVirtualItems().map((virtualItem) => (
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
              <div className="grid grid-cols-4">
                <div className="flex flex-col">
                  <code>{frames[virtualItem.index].frameNumber}</code>
                </div>
                <div className="flex flex-col">
                  <code>{frames[virtualItem.index].requests}</code>
                </div>
                <div className="flex flex-col">
                  <code>{frames[virtualItem.index].outputs}</code>
                </div>
                <div className="flex flex-col">
                  <code>{new Date(frames[virtualItem.index].timestamp).toLocaleDateString()} {new Date(frames[virtualItem.index].timestamp).toLocaleTimeString()}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
    <div className="flex flex-col text-white my-8 mx-8 bg-slate-100/20 p-4 rounded-xl">
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

export default PrimaryDashboard;
