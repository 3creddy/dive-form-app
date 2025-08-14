// backend/utils/coordMap.js
// Coordinates are in PDF points (1 pt = 1/72 inch). Origin (0,0) is bottom-left.
// You'll tweak these after using the grid preview.

module.exports = {
  // Example mapping structure per file and page
  // Put real numbers after we inspect the grid and page sizes.
  coordsByFile: {
    "TR-RDC-SCUBA_English-Metric.pdf": {
  0: {
    firstName:   { x: 113, y: 755, size: 12, maxWidth: 200 },
    lastName:    { x: 340, y: 755, size: 12, maxWidth: 200 },
    fullName:    { x: 43,  y: 87,  size: 12, maxWidth: 320 },
    date:        { x: 492, y: 87,  size: 12 },

    parentName:  { x: 43,  y: 54,  size: 12, maxWidth: 260 },
    parentDate:  { x: 492, y: 54,  size: 12 },

	sigGuest:    { x: 264, y: 87, width: 220, height: 19 },
    sigGuardian: { x: 264, y: 54, width: 220, height: 19 }
  }
},
    "TR-WAIVER_English-Metric.pdf": {
      0: {
        name: { x: 200, y: 730, size: 12 },
        date: { x: 460, y: 90, size: 12 },
        parentName: { x: 200, y: 70, size: 12 },
        parentDate: { x: 460, y: 70, size: 12 }
      }
    },
    "TR-WAIVER-BOAT_English-Metric.pdf": {
      0: {
        name: { x: 200, y: 720, size: 12 }, // “Participant’s Name (Print)”
        date: { x: 480, y: 720, size: 12 },
      },
      1: {}, // fill later if needed
      2: {
        youthName: { x: 180, y: 160, size: 12 },
        youthDob: { x: 410, y: 160, size: 12 },
        parentName: { x: 210, y: 120, size: 12 },
        parentDate: { x: 480, y: 120, size: 12 }
      }
    },
    "TR-MEDICAL-DIVER_English-Metric.pdf": {
      0: {
        participantName: { x: 170, y: 155, size: 12 },
        birthdate: { x: 400, y: 155, size: 12 },
        facilityName: { x: 170, y: 135, size: 12 },
        date: { x: 400, y: 135, size: 12 },
      }
      // pages 1 & 2 may need checkmarks/text later
    },
    "TR-WAIVER-Youth_English-Metric.pdf": {
      0: {
        name: { x: 200, y: 160, size: 12 },
        date: { x: 480, y: 160, size: 12 },
        parentName: { x: 250, y: 120, size: 12 },
        parentDate: { x: 480, y: 120, size: 12 }
      }
    }
  },

  // Checkbox examples (fill these once you identify positions)
  // Coordinates where you want an "X" to be drawn.
  checkboxByFile: {
    "TR-MEDICAL-DIVER_English-Metric.pdf": {
      1: {
        // example: q1yes: { x: 100, y: 640 }, q1no: { x: 140, y: 640 }
      }
    }
  }
};
