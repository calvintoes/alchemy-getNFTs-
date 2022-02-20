import { providers } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { BASE_URL } from "../constants";
import styles from "../styles/Home.module.css";
import { createAlchemyWeb3 } from "@alch/alchemy-web3";

export default function Home() {
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState("");
  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();
  const [nfts, setNfts] = useState();

  useEffect(() => {
    if (walletConnected) getNFTs();
  }, [walletConnected]);

  /*
      connectWallet: Connects the MetaMask wallet
    */
  const connectWallet = async () => {
    if (walletConnected) return;

    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      await getProviderOrSigner();
      setAddress();
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * get NFTs of the connected wallet
   */
  const getNFTs = async () => {
    const web3 = createAlchemyWeb3(
      `${BASE_URL}/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
    );

    const nfts = await web3.alchemy.getNfts({
      owner: walletConnected,
    });

    setNfts(nfts.ownedNfts);
  };

  /**
   * getOwner: calls the contract to retrieve the owner
   */
  const setAddress = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress();
      setWalletConnected(address);
    } catch (err) {
      console.error(err.message);
    }
  };

  /**
   * Returns a Provider or Signer object representing the Ethereum RPC with or without the
   * signing capabilities of metamask attached
   *
   * A `Provider` is needed to interact with the blockchain - reading transactions, reading balances, reading state, etc.
   *
   * A `Signer` is a special type of Provider used in case a `write` transaction needs to be made to the blockchain, which involves the connected account
   * needing to make a digital signature to authorize the transaction being sent. Metamask exposes a Signer API to allow your website to
   * request signatures from the user using Signer functions.
   *
   * @param {*} needSigner - True if you need the signer, default false otherwise
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Rinkeby network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();

      return signer;
    }
    return web3Provider;
  };

  /*
      renderButton: Returns a button based on the state of the dapp
    */
  const renderButton = () => {
    // If wallet is not connected, return a button which allows them to connect their wllet
    const btnContent = walletConnected ? "Connected" : "Connect your wallet";
    return (
      <button onClick={connectWallet} className={styles.button}>
        {btnContent}
      </button>
    );
  };

  return (
    <div>
      <Head>
        <title>NFT</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to NFT Line Pass</h1>
          <div className={styles.description}>
            Its an NFT collection for cool kids.
          </div>
          <div>Make sure you&apos;re on Rinkeby Network</div>
          <div className={styles.description}></div>
          {renderButton()}
          <p>{walletConnected}</p>
        </div>
        <div>
          {walletConnected && nfts && (
            <p>
              You own <b>{nfts.length}</b> NFTs
            </p>
          )}
        </div>
      </div>

      <footer className={styles.footer}>Made with &#10084; by Calvin To</footer>
    </div>
  );
}
