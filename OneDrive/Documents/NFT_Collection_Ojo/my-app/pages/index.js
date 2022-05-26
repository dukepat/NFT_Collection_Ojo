import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { providers, Contract, utils } from 'ethers';
import { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from '../constants';

export default function Home() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [presaleStarted, setPresaleStarted] = useState(false);
  const [presaleEnded, setPresaleEnded] = useState(false);
  const [loading, setLoading] = useState(false)
  const [isOwner, setIsOwner] = useState(false);
  const [numTokensMinted, setNumTokensMinted] = useState("");
  const [totalMintable, setTotalMintable] = useState("");

  const web3ModalRef = useRef();

  const totalMintableTokens = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI, 
        provider
        );
      const maxTokenIds = await nftContract.maxTokensIds();
      setTotalMintable(maxTokenIds.toString());

    } catch (error) {
      console.error(error)

      return false;
    }
  }

  const getNumMintedTokens = async () => {
    try {
      const provider = await getProviderOrSigner();
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI, 
        provider
        );

      const numTokenIds = await nftContract.tokensIds();
      setNumTokensMinted(numTokenIds.toString());

    } catch (error) {
      console.error(error)
    }
  }




  const presaleMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI, 
        signer
        );

        const txn = await nftContract.presaleMint({
          value: utils.parseEther("0.01")
        });
        setLoading(true);

        await txn.wait();
        setLoading(false);

        window.alert("You successfully minted a cryptoDev in presale!")

    } catch (error) {
      console.error(error)
    }
  }

  const publicMint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI, 
        signer
        );

        const txn = await nftContract.mint({
          value: utils.parseEther("0.015")
        });
        setLoading(true);
        await txn.wait();
        setLoading(false);
        window.alert("You successfully minted a cryptoDev!")

    } catch (error) {
      console.error(error)
    }
  }
  const getOwner = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI, 
        signer
        );

        const owner = await nftContract.owner();
        const userAddress = await signer.getAddress();

        if (owner.toLowerCase() === userAddress.toLowerCase()) {
          setIsOwner(true);
        }

    } catch (error) {
      console.error(error);
    }
  }
  const startPresale = async() => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI, 
        signer
        );

        const txn = await nftContract.startPresale();
        setLoading(true);
        await txn.wait();
        setLoading(false);
        setPresaleStarted(true);

    } catch (error) {
      console.error(error);
    }
  }

  const checkIfPresaleStarted = async () => {
    try {

      const provider = await getProviderOrSigner();
      // Get an instance of the NFT Contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI, 
        provider
        );

        const isPresaleStarted = await nftContract.presaleStarted();
        setPresaleStarted(isPresaleStarted);
        return isPresaleStarted;
    } catch (error) {
      console.error(error)
      return false;
    }
  };

  const checkIfPresaleEnded = async () => {
    try {
      const provider = await getProviderOrSigner();
      // Get an instance of the NFT Contract
      const nftContract = new Contract(
        NFT_CONTRACT_ADDRESS, 
        NFT_CONTRACT_ABI, 
        provider
        );
        // This will return a big Number because of Uint256 time stamp in sec
        const presaleEndTime = await nftContract.presaleEnded();
        const currentTimeInSeconds = Date.now() / 1000;
        const hasPresaleEnded = presaleEndTime.lt(
          Math.floor(currentTimeInSeconds)
          );

          if (hasPresaleEnded) {
            setPresaleEnded(true);

          }
          else {
            setPresaleEnded(false);
          }
          return hasPresaleEnded;

    } catch (error) {
      console.error(error);
      return false;
    }
  }


  const connectWallet = async() => {
    try {
      await getProviderOrSigner();
    setWalletConnected(true);

    // Update 'walletConnected' to be true
    } catch (error) {
      console.error(error);
    }
    
  };

  const getProviderOrSigner = async (needSigner = false) => {
  
    // We need to gain access to the provider/signer from metamask
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If the user is not connected to Rinkeby, tell them to switch to rinkeby

    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Please switch to the Rinkeby network");
      throw new Error("Incorrect network")
    };

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }

    return web3Provider;
  };

  const onPageLoad = async () => {
    await connectWallet();
    await getOwner();
    const _presaleStarted = await checkIfPresaleStarted();
    if (_presaleStarted) {
      await checkIfPresaleEnded();
    }

    await getNumMintedTokens();

    await totalMintableTokens();

      // Track inn realtime the numbers of minted NFTs
      //Track in realtime the status of sales

    setInterval(async() => {
      await getNumMintedTokens()
    }, 5 * 1000);

    setInterval(async() => {
      const _presaleStarted = await checkIfPresaleStarted();
      if (_presaleStarted) {
        await checkIfPresaleEnded()
      } 
    }, 5 * 1000);
  }

  useEffect(() => {
    if (!walletConnected) {
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });

     onPageLoad();
      
    }

  }, [walletConnected]);

  function renderBody() {
    if (!walletConnected) {
      return (
        <button onClick={connectWallet} className={styles.button}> Connect your Wallet</button>
      );
    }

    if (loading) {
      return (
        <div className={styles.description}>
          <button className={styles.button}> Loading... </button>
        </div>
      )
    }

    if (isOwner && !presaleStarted) {
      // render a button to start the presale
      return (
        <button onClick={startPresale} className={styles.button}>
          Start Presale
        </button>
      );
      }

      if (!isOwner && !presaleStarted){
        return (
          <div>
            <div className={styles.description}>
            Presale has not started yet check back later
            </div>
            
          </div>
        );
      }

      if (presaleStarted && !presaleEnded) {
        // allow users to mint in presale
        // they need to be in whitelist for this to work
        return (
          <div>
            <span className={styles.description}>
              Presale has started! If your address is whitelisted, you can mint a Crypto Dev!
            </span>

            <button onClick={presaleMint} className={styles.button}>
              Presale Mint 🚀
            </button>
          </div>
        );
       
      }

      if (presaleEnded) {
        // allow users to take part in public mint sale
        return(
          <div>
          <div className={styles.description}>
            Presale has ended. You can mint a Crypto Dev in public sale if any remains
          </div>
          
          <div className={styles.description}>
               { numTokensMinted }/ {totalMintable} NFTs have been minted
          </div>

          <button onClick={publicMint} className={styles.button}>
            Public Mint 🚀
          </button>

         
        </div>
        );
        
       
      }

      return (
        <div>
            {numTokensMinted}/{totalMintableTokens()}
          </div>
      );
  }

  return ( 
    <div className={styles.main}> 
      <Head>
        <title>Crypto Devs NFT</title>
      </Head>

      <div>

        <div>
          <h1 className={styles.title}>Welcome to CryptoDevs NFT</h1>
          <div className={styles.description}>
            CryptoDevs is a collection for web3 developers
          </div>
          
          <div>
          {renderBody()}
          </div>
        </div>
        <img className={styles.image} src="/cryptodevs/0.svg" />
      </div>

      <div>
        <footer>
          Made with &#10084; by CryptoDevs DHC-v2 (c) 2022
        </footer>
      </div>
    
    </div>
  );
}

