import { useEffect } from "react";
import { useState } from "react";
import { createContext } from "react";
import { BrowserProvider, Contract } from "ethers";
import abi from "../contract/abi";

const contractAddress = '0x3dc925356ef71311dfa86d0af712b761941531fa';

export const WalletContext = createContext();

export const WalletContextProvider = ({children}) => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [address, setAddress] = useState(null);
    const [contract, setContract] = useState(null);

    useEffect(() => {
        const initContext = async () => {
            if (window.ethereum) {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const tempProvider = new BrowserProvider(window.ethereum);
                setProvider(tempProvider);
                const tempSigner = await tempProvider.getSigner();
                setSigner(tempSigner);
                const tempAddress = await tempSigner.getAddress();
                setAddress(tempAddress);
                const tempContract = new Contract(contractAddress, abi.result, tempSigner);
                setContract(tempContract);
            }
        };

        initContext();
    }, []);

    return (
        <WalletContext.Provider value={{provider, signer, address, contract}}>{children}</WalletContext.Provider>
    )
}