// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./IWhitelist.sol";

contract CryptoDevs is ERC721Enumerable, Ownable  {
    string _baseTokenURI;
    
    // _price of one crypto Dev NFT
    uint256 public _price = 0.01 ether;

    // _paused is used to pause the smart contract in case of an emergency

    bool public _paused;

    //max number of CryptoDevs
    uint256 public maxTokensIds = 20;

    // total number of tokenIds minted
    uint256 public tokensIds;

    // IWhitelist contract instance

    IWhitelist whitelist;

    // boolean to keep track of the presale started or not
    bool public presaleStarted;

    // timestamp for when presale would end
    uint256 public presaleEnded;

    modifier onlyWhenNotPaused {
        require(!_paused, "Contract is currently paused");
        _;
    }

    /**
    * @dev ERC721 constructor takes in a `name` and a `symbol` to the token collection.
    * name in our case is `Crypto Devs` and symbol is `CD`.
    * Constructor for Crypto Devs takes in the baseURI to set _baseTokenURI for the collection.
    * It also initializes an instance of whitelist interface.
    */ 

    constructor (string memory baseURI, address whitelistContract) ERC721("Crypto Devs", "CD") {
        _baseTokenURI = baseURI;
        whitelist = IWhitelist(whitelistContract);
    }

    // @dev startPresale starts a presale for the whitelisted addresses in contract
    function startPresale() public onlyOwner {
        presaleStarted = true;

        presaleEnded = block.timestamp + 5 minutes;
    }

    // @dev presaleMint allows a user to mint one NFT per transaction during presale.abi

    function presaleMint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp < presaleEnded, "Presale is not running");
        require(whitelist.whitelistedAddresses(msg.sender), "You are not whitelisted");
        require(tokensIds < maxTokensIds, "Exceeded maximum Crypto Devs supply");
        require(msg.value >= _price, "Ether Sent is not correct");
        tokensIds += 1;
        _safeMint(msg.sender, tokensIds);
    }

    function mint() public payable onlyWhenNotPaused {
        require(presaleStarted && block.timestamp >= presaleEnded, "Presale has not ended");
        require(tokensIds < maxTokensIds, "Exceeded maximum Crypto Devs supply");
        require(msg.value >= _price, "Ether Sent is not correct");
        tokensIds += 1;
        _safeMint(msg.sender, tokensIds);
    }

    





}
