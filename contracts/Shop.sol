// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

contract Shop is Ownable {
    struct Package {
        uint256 price;
        bool active;
    }

    IERC20 public immutable usdt;
    address public treasury;
    mapping(uint256 => Package) public packages;

    event PackageConfigured(uint256 indexed packageId, uint256 price, bool active);
    event Purchase(address indexed buyer, uint256 packageId, uint256 amount, uint256 timestamp);

    constructor(address usdtToken, address treasuryAddress, address initialOwner) Ownable(initialOwner) {
        require(usdtToken != address(0), "invalid usdt");
        require(treasuryAddress != address(0), "invalid treasury");
        usdt = IERC20(usdtToken);
        treasury = treasuryAddress;
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "invalid treasury");
        treasury = newTreasury;
    }

    function setPackage(uint256 packageId, uint256 price, bool active) external onlyOwner {
        packages[packageId] = Package({price: price, active: active});
        emit PackageConfigured(packageId, price, active);
    }

    function buy(uint256 packageId) external {
        Package memory pkg = packages[packageId];
        require(pkg.active, "package inactive");
        require(pkg.price > 0, "price zero");

        bool ok = usdt.transferFrom(msg.sender, treasury, pkg.price);
        require(ok, "transfer failed");

        emit Purchase(msg.sender, packageId, pkg.price, block.timestamp);
    }
}
