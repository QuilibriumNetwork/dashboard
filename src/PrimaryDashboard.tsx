import React, { useCallback, useEffect, useState } from 'react';
import { AxisOptions, Chart } from 'react-charts';
import { base58_to_binary } from "base58-js";

const PrimaryDashboard = () => {
  const [data, setData] = useState<{
    label: string;
    data: { x: Date; y: number }[];
  }[]>([{
    label: 'Live Peers',
    data: [{x: new Date(), y: 0}],
  }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [init, setInit] = useState(false);
  const [testing, setTesting] = useState(false);
  const [found, setFound] = useState(false);
  const [peerId, setPeerId] = useState<string>("");
  const [selfTestError, setSelfTestError] = useState<string>();


  useEffect(() => {
    if (loading && !init) {
      setInit(true);
      fetch("https://dashboard-api.quilibrium.com/live-peers").then(async (r) => {
        const results = (await r.json());
        const spans: { x: Date; y: number }[] = [];
        for (const k of Object.keys(results)) {
          spans.push({x: new Date(parseInt(k, 10)), y: results[k]});
        }
        setData([{
          label: 'Live Peers',
          data: spans
        }]);
        setLoading(false);
      }).catch((e) => {
        setLoading(false);
        setError(e.message);
      })
    }
  }, [init, loading]);
    
  const primaryAxis = React.useMemo(
    (): AxisOptions<{x: Date; y: number;}> => ({
      getValue: datum => datum.x,
      scaleType: 'localTime',
    }),
    []
  );

  const secondaryAxes = React.useMemo(
    (): AxisOptions<{x: Date; y: number;}>[] => [
      {
        getValue: datum => datum.y,
        min: 0,
      },
    ],
    []
  );

  const test = useCallback(async () => {
    setTesting(true);
    setSelfTestError(undefined);
    try {
      if (peerId !== "") {
        const pb = base58_to_binary(peerId);
        const p64 = Buffer.from(pb).toString('base64');
        fetch("https://dashboard-api.quilibrium.com/network-info").then(async (r) => {
          const results = (await r.json());
          let found: {
            "peer_id": string;
            "difficulty": number;
            "difficulty_metric": number;
            "commit_16_metric": number;
            "commit_128_metric": number;
            "commit_1024_metric": number;
            "commit_65536_metric": number;
            "proof_16_metric": number;
            "proof_128_metric": number;
            "proof_1024_metric": number;
            "proof_65536_metric": number;
            "cores": number;
            "memory": string;
            "storage": string;
            "master_head_frame": number;
            "last_seen": number;
          } | undefined;
          outer:
          for (const k of Object.keys(results)) {
            for (let i = 0; i < results[k].length; i++) {
              if (results[k][i]["peer_id"] === p64) {
                found = results[k][i];
                break outer;
              }
            }
          }

          if (found) {
            setFound(true);
          } else {
            setSelfTestError("Could not find peer.");
          }
        }).catch((e) => {
          setSelfTestError(e.message);
        })
      }
    } catch (e: any) {
      setSelfTestError(e.message);
    }
    setTesting(false);
  }, [peerId])

  return (
    <>
    <div className="flex flex-col mx-8 bg-slate-100/20 p-4 rounded-xl">
      <div className="text-xl text-white">Live Peers</div>
      <div className="w-full h-80">
        {!loading && !error && <Chart
          options={{
            data,
            dark: true,
            defaultColors: ['#fff'],
            primaryAxis,
            secondaryAxes,
          }}
        />}
        {error && <>An error occurred, please refresh.</>}
      </div>
    </div>
    <div className="flex flex-col text-white my-8 mx-8 bg-slate-100/20 p-4 rounded-xl">
      <div className="text-xl">Self-Test</div>
      <div className="py-4">
        Verify a bootstrap node can see you by entering your Peer ID.
      </div>
      <div>
        <input className="rounded-xl bg-slate-400/20 text-white p-2 min-w-[400pt]" value={peerId} onChange={(e) => { setFound(false); setPeerId(e.target.value); }}/>
        <button className="rounded-xl bg-slate-100 text-black py-2 px-4 ml-2" title="Test" disabled={testing} onClick={test}>Test</button>
      </div>
      <div className="pt-4">
        {found && <>Peer was visible to bootstraps!</>}
        {selfTestError && <span className="text-red-100">{selfTestError}</span>}
      </div>
    </div>
    </>
  );
}

export default PrimaryDashboard;