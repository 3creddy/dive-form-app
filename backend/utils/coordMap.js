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

    parentName:  { x: 43,  y: 55,  size: 12, maxWidth: 260 },
    parentDate:  { x: 492, y: 55,  size: 12 },

	sigGuest:    { x: 264, y: 87, width: 220, height: 19 },
    sigGuardian: { x: 264, y: 55, width: 220, height: 19 }
  }
},
    "TR-WAIVER_English-Metric.pdf": {
        0: {
			firstName:   { x: 113, y: 755, size: 12, maxWidth: 200 },
			lastName:    { x: 340, y: 755, size: 12, maxWidth: 200 },

			fullName: [
			{ x: 293, y: 618, size: 11, maxWidth: 320 },   // first location
			{ x: 43,  y: 87,  size: 12, maxWidth: 320 }    // second location
			],

			facilityName:{ x: 39, y: 587, size: 11, maxWidth: 320 },
			date:        { x: 494, y: 87, size: 12 },
			parentName:  { x: 43, y: 55, size: 12, maxWidth: 260 },
			parentDate:  { x: 493, y: 55, size: 12 },

			sigGuest:    { x: 264, y: 87, width: 220, height: 19 },
			sigGuardian: { x: 264, y: 55, width: 220, height: 19 }
		
	      }
    },
    "TR-WAIVER-BOAT_English-Metric.pdf": {
      0: {
 			firstName:   { x: 113, y: 755, size: 12, maxWidth: 200 },
			lastName:    { x: 340, y: 755, size: 12, maxWidth: 200 },
			facilityName:{ x: 39, y: 641, size: 11, maxWidth: 320 }
      },
      1: {
 			firstName:   { x: 113, y: 755, size: 12, maxWidth: 200 },
			lastName:    { x: 340, y: 755, size: 12, maxWidth: 200 },	
			fullName: [
			{ x: 42,  y: 243,  size: 12, maxWidth: 320 }    // only location
			],		
			sigGuest:    { x: 214, y: 243, width: 220, height: 19 },
			dob: 	 { x: 391, y: 243, size: 12 },
			date:        { x: 477, y: 243, size: 12 },
			email:       { x: 460, y: 205, size: 10, maxWidth: 120 },
			phone:        { x: 392, y: 204, size: 10 }
	  }, // fill later if needed
      2: {
        firstName:   { x: 113, y: 755, size: 12, maxWidth: 200 },
		lastName:    { x: 340, y: 755, size: 12, maxWidth: 200 },	
		fullName: [
			{ x: 42,  y: 83,  size: 12, maxWidth: 320 }    // only location
			],
		dob: 	 { x: 212, y: 83, size: 12 },
		parentName:  { x: 43, y: 51, size: 12, maxWidth: 260 },
		parentDate:  { x: 393, y: 51, size: 12 },
		sigGuardian: { x: 215, y: 51, width: 220, height: 19 }
		
      }
    },
    "TR-MEDICAL-DIVER_English-Metric.pdf": {
  // ---------- PAGE 0: Participant info + 10 initial questions ----------
  0: {
    // Participant info (text)
    fullName: [
				{ x: 204, y: 750, size: 11, maxWidth: 120 }, 
				{ x: 44, y: 132, size: 11, maxWidth: 120 }
			  ],	
    dob: [
			{ x: 394, y: 750, size: 12 }, 
			{ x: 307, y: 132, size: 12 }
		],
	facilityName: { x: 306, y: 105, size: 11, maxWidth: 320 },
	sigGuest: { x: 42, y: 155, width: 120, height: 19 },
    date: { x: 307, y: 155, size: 12 },
	parentName:  { x: 183, y: 132, size: 12, maxWidth: 260 },
    sigGuardian: { x: 183, y: 155, width: 120, height: 19 },
	
    //TO ADD LATER
    //email:        { x: /*bl*/, y: /*bl*/, size: 12, maxWidth: 280 },
    //phone:        { x: /*bl*/, y: /*bl*/, size: 12, maxWidth: 180 },

    // Initial 10 questions — map BOTH Yes/No boxes per question
    // Measure the CENTER of each printed box; set box to ~12–14
// TR-MEDICAL page 0 — checkbox YES/NO entries (dot-path style)
"medical.q.q1_yes":  { x: 481, y: 508, type: "checkbox", mark: "x", box: 12 },
"medical.q.q1_no":   { x: 529, y: 501, type: "checkbox", mark: "x", box: 12 },

"medical.q.q2_yes":  { x: 481, y: 481, type: "checkbox", mark: "x", box: 12 },
"medical.q.q2_no":   { x: 529, y: 475, type: "checkbox", mark: "x", box: 12 },

"medical.q.q3_yes":  { x: 479, y: 448, type: "checkbox", mark: "x", box: 12 },
"medical.q.q3_no":   { x: 529, y: 448, type: "checkbox", mark: "x", box: 12 },

"medical.q.q4_yes":  { x: 481, y: 428, type: "checkbox", mark: "x", box: 12 },
"medical.q.q4_no":   { x: 529, y: 422, type: "checkbox", mark: "x", box: 12 },

"medical.q.q5_yes":  { x: 479, y: 396, type: "checkbox", mark: "x", box: 12 },
"medical.q.q5_no":   { x: 529, y: 396, type: "checkbox", mark: "x", box: 12 },

"medical.q.q6_yes":  { x: 481, y: 375, type: "checkbox", mark: "x", box: 12 },
"medical.q.q6_no":   { x: 529, y: 369, type: "checkbox", mark: "x", box: 12 },

"medical.q.q7_yes":  { x: 481, y: 349, type: "checkbox", mark: "x", box: 12 },
"medical.q.q7_no":   { x: 529, y: 343, type: "checkbox", mark: "x", box: 12 },

"medical.q.q8_yes":  { x: 481, y: 322, type: "checkbox", mark: "x", box: 12 },
"medical.q.q8_no":   { x: 529, y: 316, type: "checkbox", mark: "x", box: 12 },

"medical.q.q9_yes":  { x: 481, y: 296, type: "checkbox", mark: "x", box: 12 },
"medical.q.q9_no":   { x: 529, y: 290, type: "checkbox", mark: "x", box: 12 },

"medical.q.q10_yes": { x: 479, y: 264, type: "checkbox", mark: "x", box: 12 },
"medical.q.q10_no":  { x: 529, y: 264, type: "checkbox", mark: "x", box: 12 }


    // Participant signature/date (bottom of page 0 typically)

	//parentName:   { x: /*bl*/, y: /*bl*/, size: 12, maxWidth: 260 },
    //parentDate:   { x: /*bl*/, y: /*bl*/, size: 12 },

  },

  // ---------- PAGE 1: Follow-up Boxes A–G (only shown when triggered) ----------
  1: {
    fullName: { x: 204, y: 750, size: 11, maxWidth: 120 },	
    dob: { x: 394, y: 750, size: 12 },
	
"medical.q.A1_yes":  { x: 500, y: 664, type: "checkbox", mark: "x", box: 12 },
"medical.q.A1_no":  { x: 532, y: 664, type: "checkbox", mark: "x", box: 12 },
"medical.q.A2_yes":  { x: 500, y: 651, type: "checkbox", mark: "x", box: 12 },
"medical.q.A2_no":  { x: 532, y: 651, type: "checkbox", mark: "x", box: 12 },
"medical.q.A3_yes":  { x: 500, y: 630, type: "checkbox", mark: "x", box: 12 },
"medical.q.A3_no":  { x: 532, y: 630, type: "checkbox", mark: "x", box: 12 },
"medical.q.A4_yes":  { x: 500, y: 617, type: "checkbox", mark: "x", box: 12 },
"medical.q.A4_no":  { x: 532, y: 617, type: "checkbox", mark: "x", box: 12 },
"medical.q.A5_yes":  { x: 500, y: 604, type: "checkbox", mark: "x", box: 12 },
"medical.q.A5_no":  { x: 532, y: 604, type: "checkbox", mark: "x", box: 12 },
"medical.q.B1_yes":  { x: 500, y: 567, type: "checkbox", mark: "x", box: 12 },
"medical.q.B1_no":  { x: 532, y: 567, type: "checkbox", mark: "x", box: 12 },
"medical.q.B2_yes":  { x: 500, y: 554, type: "checkbox", mark: "x", box: 12 },
"medical.q.B2_no":  { x: 532, y: 554, type: "checkbox", mark: "x", box: 12 },
"medical.q.B3_yes":  { x: 500, y: 541, type: "checkbox", mark: "x", box: 12 },
"medical.q.B3_no":  { x: 532, y: 541, type: "checkbox", mark: "x", box: 12 },
"medical.q.B4_yes":  { x: 500, y: 520, type: "checkbox", mark: "x", box: 12 },
"medical.q.B4_no":  { x: 532, y: 520, type: "checkbox", mark: "x", box: 12 },
"medical.q.C1_yes":  { x: 500, y: 483, type: "checkbox", mark: "x", box: 12 },
"medical.q.C1_no":  { x: 532, y: 483, type: "checkbox", mark: "x", box: 12 },
"medical.q.C2_yes":  { x: 500, y: 470, type: "checkbox", mark: "x", box: 12 },
"medical.q.C2_no":  { x: 532, y: 470, type: "checkbox", mark: "x", box: 12 },
"medical.q.C3_yes":  { x: 500, y: 458, type: "checkbox", mark: "x", box: 12 },
"medical.q.C3_no":  { x: 532, y: 458, type: "checkbox", mark: "x", box: 12 },
"medical.q.C4_yes":  { x: 500, y: 444, type: "checkbox", mark: "x", box: 12 },
"medical.q.C4_no":  { x: 532, y: 444, type: "checkbox", mark: "x", box: 12 },
"medical.q.D1_yes":  { x: 500, y: 408, type: "checkbox", mark: "x", box: 12 },
"medical.q.D1_no":  { x: 532, y: 408, type: "checkbox", mark: "x", box: 12 },
"medical.q.D2_yes":  { x: 500, y: 394, type: "checkbox", mark: "x", box: 12 },
"medical.q.D2_no":  { x: 532, y: 394, type: "checkbox", mark: "x", box: 12 },
"medical.q.D3_yes":  { x: 500, y: 382, type: "checkbox", mark: "x", box: 12 },
"medical.q.D3_no":  { x: 532, y: 382, type: "checkbox", mark: "x", box: 12 },
"medical.q.D4_yes":  { x: 500, y: 369, type: "checkbox", mark: "x", box: 12 },
"medical.q.D4_no":  { x: 532, y: 369, type: "checkbox", mark: "x", box: 12 },
"medical.q.D5_yes":  { x: 500, y: 356, type: "checkbox", mark: "x", box: 12 },
"medical.q.D5_no":  { x: 532, y: 356, type: "checkbox", mark: "x", box: 12 },
"medical.q.E1_yes":  { x: 500, y: 319, type: "checkbox", mark: "x", box: 12 },
"medical.q.E1_no":  { x: 532, y: 319, type: "checkbox", mark: "x", box: 12 },
"medical.q.E2_yes":  { x: 500, y: 306, type: "checkbox", mark: "x", box: 12 },
"medical.q.E2_no":  { x: 532, y: 306, type: "checkbox", mark: "x", box: 12 },
"medical.q.E3_yes":  { x: 500, y: 293, type: "checkbox", mark: "x", box: 12 },
"medical.q.E3_no":  { x: 532, y: 293, type: "checkbox", mark: "x", box: 12 },
"medical.q.E4_yes":  { x: 500, y: 280, type: "checkbox", mark: "x", box: 12 },
"medical.q.E4_no":  { x: 532, y: 280, type: "checkbox", mark: "x", box: 12 },
"medical.q.F1_yes":  { x: 500, y: 244, type: "checkbox", mark: "x", box: 12 },
"medical.q.F1_no":  { x: 532, y: 244, type: "checkbox", mark: "x", box: 12 },
"medical.q.F2_yes":  { x: 500, y: 231, type: "checkbox", mark: "x", box: 12 },
"medical.q.F2_no":  { x: 532, y: 230, type: "checkbox", mark: "x", box: 12 },
"medical.q.F3_yes":  { x: 500, y: 221, type: "checkbox", mark: "x", box: 12 },
"medical.q.F3_no":  { x: 532, y: 218, type: "checkbox", mark: "x", box: 12 },
"medical.q.F4_yes":  { x: 500, y: 205, type: "checkbox", mark: "x", box: 12 },
"medical.q.F4_no":  { x: 532, y: 205, type: "checkbox", mark: "x", box: 12 },
"medical.q.F5_yes":  { x: 500, y: 192, type: "checkbox", mark: "x", box: 12 },
"medical.q.F5_no":  { x: 532, y: 192, type: "checkbox", mark: "x", box: 12 },
"medical.q.G1_yes":  { x: 500, y: 155, type: "checkbox", mark: "x", box: 12 },
"medical.q.G1_no":  { x: 532, y: 155, type: "checkbox", mark: "x", box: 12 },
"medical.q.G2_yes":  { x: 500, y: 142, type: "checkbox", mark: "x", box: 12 },
"medical.q.G2_no":  { x: 532, y: 142, type: "checkbox", mark: "x", box: 12 },
"medical.q.G3_yes":  { x: 500, y: 130, type: "checkbox", mark: "x", box: 12 },
"medical.q.G3_no":  { x: 532, y: 130, type: "checkbox", mark: "x", box: 12 },
"medical.q.G4_yes":  { x: 500, y: 116, type: "checkbox", mark: "x", box: 12 },
"medical.q.G4_no":  { x: 532, y: 116, type: "checkbox", mark: "x", box: 12 },
"medical.q.G5_yes":  { x: 500, y: 104, type: "checkbox", mark: "x", box: 12 },
"medical.q.G5_no":  { x: 532, y: 104, type: "checkbox", mark: "x", box: 12 },
"medical.q.G6_yes":  { x: 500, y: 90, type: "checkbox", mark: "x", box: 12 },
"medical.q.G6_no":  { x: 532, y: 90, type: "checkbox", mark: "x", box: 12 }




	
  },
    },
    "TR-WAIVER-Youth_English-Metric.pdf": {
      0: {
		firstName:   { x: 113, y: 755, size: 12, maxWidth: 200 },
		lastName:    { x: 340, y: 755, size: 12, maxWidth: 200 },
		fullName:    { x: 43,  y: 88,  size: 12, maxWidth: 320 },
        date: { x: 493, y: 88, size: 12 },
        parentName: { x: 44, y: 55, size: 12 },
		sigGuest:    { x: 267, y: 88, width: 220, height: 19 },
		sigGuardian: { x: 267, y: 55, width: 220, height: 19 },
        parentDate: { x: 493, y: 55, size: 12 }
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
