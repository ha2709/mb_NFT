// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.13;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

import "@openzeppelin/contracts/utils/Counters.sol";

 

contract MBNFT is ERC721URIStorage {
    uint public startDate;
    uint public endDate;

    using Counters for Counters.Counter;
    Counters.Counter public _tokenIds;

    mapping(address => string) public  receipts;
    mapping(uint256 => string) public _tokenURIs;

    constructor(uint256 _startDate, uint256 _endDate) ERC721("Mercedes-Benz NFT", "MB-NFT") {
        startDate = _startDate;
        endDate = _endDate;       
    }

    function mintNFT(address to,  string memory tokenURI,   string memory receipt ) public returns (uint256) {
         
        
        require(block.timestamp >= startDate && block.timestamp <= endDate, "Expired time");
        require(balanceOf(to) == 0, "Already Mint");
        require(_tokenIds._value < 5, "Exceed Limit");
        _tokenIds.increment();
        
        uint256 newItemId = _tokenIds.current();
        _tokenURIs[newItemId]= tokenURI;
        _safeMint(to, newItemId);
        setTokenUri(newItemId, tokenURI);

        receipts[to] = receipt;

        return newItemId;
    }

    function setTokenUri(uint256 tokenId, string memory tokenURI) private {

        _tokenURIs[tokenId] = tokenURI;
    }

 
    /// @notice function to allow third party like Opensea store our metadata off chain
    function tokenURI(
        uint256 tokenId
    ) public view virtual override returns (string memory) {
        return _tokenURIs[tokenId];
    }

 


}
