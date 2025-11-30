// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract AirlumeData {
    // Owner of the contract
    address public owner;
    
    // Structure to store each sensor reading
    struct SensorReading {
        uint256 id;
        uint256 timestamp;
        uint256 aqi;
        int256 temperature;  // Stored as temp * 10 (e.g., 25.5°C = 255)
        uint256 humidity;
        uint256 pm25;
        uint256 gas;
        string location;
        address sensorAddress;
        bool verified;
    }
    
    // Storage
    mapping(uint256 => SensorReading) public readings;
    uint256 public totalReadings;
    
    // Events (these get logged on blockchain)
    event ReadingRecorded(
        uint256 indexed readingId,
        uint256 aqi,
        string location,
        uint256 timestamp
    );
    
    event ReadingVerified(uint256 indexed readingId);
    
    // Constructor (runs once when contract is deployed)
    constructor() {
        owner = msg.sender;
        totalReadings = 0;
    }
    
    // Modifier to restrict functions to owner only
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this");
        _;
    }
    
    // Main function to record sensor data
    function recordReading(
        uint256 _aqi,
        int256 _temperature,
        uint256 _humidity,
        uint256 _pm25,
        uint256 _gas,
        string memory _location
    ) public returns (uint256) {
        totalReadings++;
        
        readings[totalReadings] = SensorReading({
            id: totalReadings,
            timestamp: block.timestamp,
            aqi: _aqi,
            temperature: _temperature,
            humidity: _humidity,
            pm25: _pm25,
            gas: _gas,
            location: _location,
            sensorAddress: msg.sender,
            verified: false
        });
        
        emit ReadingRecorded(totalReadings, _aqi, _location, block.timestamp);
        
        return totalReadings;
    }
    
    // Get a specific reading
    function getReading(uint256 _readingId) public view returns (
        uint256 id,
        uint256 timestamp,
        uint256 aqi,
        int256 temperature,
        uint256 humidity,
        uint256 pm25,
        uint256 gas,
        string memory location,
        bool verified
    ) {
        require(_readingId > 0 && _readingId <= totalReadings, "Invalid reading ID");
        
        SensorReading memory reading = readings[_readingId];
        
        return (
            reading.id,
            reading.timestamp,
            reading.aqi,
            reading.temperature,
            reading.humidity,
            reading.pm25,
            reading.gas,
            reading.location,
            reading.verified
        );
    }
    
    // Get latest readings (last N readings)
    function getLatestReadings(uint256 count) public view returns (uint256[] memory) {
        require(count > 0, "Count must be positive");
        
        uint256 resultCount = count > totalReadings ? totalReadings : count;
        uint256[] memory result = new uint256[](resultCount);
        
        for (uint256 i = 0; i < resultCount; i++) {
            result[i] = totalReadings - i;
        }
        
        return result;
    }
    
    // Owner can verify a reading (quality control)
    function verifyReading(uint256 _readingId) public onlyOwner {
        require(_readingId > 0 && _readingId <= totalReadings, "Invalid reading ID");
        readings[_readingId].verified = true;
        emit ReadingVerified(_readingId);
    }
    
    // Get total number of readings
    function getTotalReadings() public view returns (uint256) {
        return totalReadings;
    }
} 
