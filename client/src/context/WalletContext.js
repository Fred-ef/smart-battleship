import { useEffect } from "react";
import { useState } from "react";
import { createContext } from "react";
import { BrowserProvider, Contract } from "ethers";
import abi from "../contract/abi";

const contractAddress = '0x5904d725389127141c80e775302ec8dd274f8322';

export const WalletContext = createContext();

export const WalletContextProvider = ({children}) => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [contract, setContract] = useState(null);

    useEffect(() => {
        const initContext = async () => {
            if (window.ethereum) {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const tempProvider = new BrowserProvider(window.ethereum);
                setProvider(tempProvider);
                const tempSigner = await tempProvider.getSigner();
                setSigner(tempSigner);
                const tempContract = new Contract(contractAddress, abi.result, tempSigner);
                setContract(tempContract);
            }
        };

        initContext();
    }, []);

    return (
        <WalletContext.Provider value={{provider, signer, contract}}>{children}</WalletContext.Provider>
    )
}

// 0x5904d725389127141c80e775302ec8dd274f8322