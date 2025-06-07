const express = require('express');
const router = express.Router();
const airportController = require('../controllers/airportController');


router.post('/', airportController.createAirport);
router.get('/', airportController.getAllAirports);
router.get('/:iata_code', airportController.getAirportByIataCode);
router.put('/:iata_code', airportController.updateAirport);
router.delete('/:iata_code', airportController.deleteAirport);


router.get('/nearby/query', airportController.getNearbyAirports); 

router.get('/popular/stats', airportController.getPopularAirports); 

module.exports = router;