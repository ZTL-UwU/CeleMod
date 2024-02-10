import { Fragment, createContext, h } from "preact";
import "./Everest.scss"
import { BackendDep, BackendModInfo, useCurrentBlacklistProfile, useCurrentEverestVersion, useDownloadSettings, useGamePath, useInstalledMods } from "../states";
import { useContext, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { callRemote, displayDate } from "../utils";
import { Icon } from "../components/Icon";
import { Button } from "../components/Button";
import { GlobalContext, useGlobalContext } from "../App";
//@ts-ignore
import everest from "../resources/everest.png"
import { ProgressIndicator } from "../components/Progress";

interface Maddie480EverestVersion {
    date: string,
    mainFileSize: number,
    mainDownload: string,
    olympusMetaDownload: string,
    commit: string,
    olympusBuildDownload: string,
    branch: string,
    version: number,
    isNative: boolean
}

const Channel = ({
    dataUrl, branch, onInstall, title
}: {
    dataUrl: string,
    branch: string,
    title: string,
    onInstall: (url: string) => void
}) => {
    const [data, setData] = useState<Maddie480EverestVersion[] | null>(null);

    useEffect(() => {
        console.log(dataUrl)
        fetch(dataUrl).then(res => res.json()).then(v => {
            setData(v.filter((v: Maddie480EverestVersion) => v.branch === branch.toLowerCase()));
        });
    }, [])
    
    const getDownloadUrl = (data: Maddie480EverestVersion) => {
        if(data.branch === 'stable') return `https://celeste.weg.fan/api/v2/download/everest/${data.version}`
        return data.mainDownload;
    }

    return <div className="channel">
        <h2>{title}</h2>
        <div className="list">
            {
                data === null ? <div>加载中...</div> :
                    data.length === 0 ? <div>无数据</div> : data.map((v, i) => <div key={i} className="item">
                        <div className="line1">
                            <span className="version">
                                {v.version}
                            </span>
                            <span className="date">
                                {displayDate(v.date)}
                            </span>
                        </div>
                        <div className="line2">
                            <div className="commit">
                                {v.commit.slice(0, 7)}
                            </div>
                            <Button onClick={() => onInstall(getDownloadUrl(v))}>安装</Button>
                        </div>
                    </div>)
            }
        </div>
    </div>
}

export const Everest = () => {
    const ctx = useGlobalContext();
    const { setCurrentEverestVersion, currentEverestVersion } = useCurrentEverestVersion();
    const { gamePath } = useGamePath();
    const [installingUrl, setInstallingUrl] = useState<string | null>(null);
    const [installState, setInstallState] = useState<string | null>(null);
    const [installProgress, setInstallProgress] = useState<number | null>(null);
    const [failedReason, setFailedReason] = useState<string | null>(null);

    const installEverest = (url: string) => {
        setInstallingUrl(url);
        setInstallProgress(null);
        setFailedReason(null);
        setInstallState("Downloading Everest");
        callRemote("download_and_install_everest", gamePath, url, (status: string, data: any) => {
            if (status === 'Failed') {
                setInstallState('Failed');
                setFailedReason(data);
            } else {
                setInstallState(status);
                if (typeof data === 'number') {
                    // console.log('progress', data);
                    setInstallProgress(data);
                }
            }

            if (status === 'Success') {
                ctx.everest.updateEverestVersion();
            }
        });
    }

    return <div className="everest">
        <img src={everest} alt="" srcset="" width={300} />

        <div className="line">
            {
                currentEverestVersion.length > 0 ? (<Fragment>
                    <span className="ico">
                        <Icon name="i-asterisk" />
                    </span>
                    <span className="ti">
                        当前安装的 Everest 版本
                    </span>
                    <span className="value">
                        {currentEverestVersion}
                    </span></Fragment>) : <span className="ti">
                    未安装 Everest
                </span>
            }
        </div>
        {
            installingUrl === null ? <Fragment>
                <div className="channels">
                    <Channel
                        title="Stable 通道"
                        branch="Stable"
                        dataUrl="https://maddie480.ovh/celeste/everest-versions?supportsNativeBuilds=true&wtf"
                        onInstall={url => installEverest(url)}
                    />
                    <Channel
                        title="Beta 通道"
                        branch="Beta"
                        dataUrl="https://maddie480.ovh/celeste/everest-versions?supportsNativeBuilds=true"
                        onInstall={url => installEverest(url)}
                    />
                    <Channel
                        branch="Dev"
                        title="Dev 通道"
                        dataUrl="https://maddie480.ovh/celeste/everest-versions?supportsNativeBuilds=true"
                        onInstall={url => installEverest(url)}
                    />
                </div>
            </Fragment> : <Fragment>
                <div className="installing">
                    {installState === 'Failed' ? <Fragment>
                        <div className="wrapperin">
                            <Icon name="i-cross" />
                        </div>
                        <div className="tip">安装失败</div>
                        <div className="url">{installingUrl}</div>
                        <div className="state">
                            <textarea>
                                {failedReason}
                            </textarea>
                        </div>
                        <div className="state">
                            <Button onClick={() => setInstallingUrl(null)}>取消</Button>
                        </div>
                    </Fragment> : installState === 'Success' ? <Fragment>
                        <div className="wrapperin">
                            <Icon name="i-tick" />
                        </div>
                        <div className="tip">安装成功</div>
                        <div className="url">{installingUrl}</div>
                        <div className="state">
                            <Button onClick={() => setInstallingUrl(null)}>确认</Button>
                        </div>
                    </Fragment> : <Fragment>
                        <div className="wrapperin">
                            <ProgressIndicator {
                                ...(installProgress ? {
                                    value: installProgress,
                                    max: 100
                                } : {
                                    infinite: true,
                                })} />
                        </div>
                        <div className="tip">{
                            installState === 'Downloading Everest' ? '正在下载' : '正在安装'

                        }</div>
                        <div className="url">{installingUrl}</div>
                        <div className="state">{installState}</div>
                    </Fragment>
                    }
                </div>
            </Fragment>
        }
    </div>
}