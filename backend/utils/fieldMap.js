// backend/utils/fieldMap.js
module.exports = {
  formFiles: {
    medical: "TR-MEDICAL-DIVER_English-Metric.pdf",
    rdc: "TR-RDC-SCUBA_English-Metric.pdf",
    waiver: "TR-WAIVER_English-Metric.pdf",
    boat: "TR-WAIVER-BOAT_English-Metric.pdf",
    youth: "TR-WAIVER-Youth_English-Metric.pdf",
  },
  // Which forms to include per center; RDC is only once even if both centers
  bundleForCenters(centers, isMinor) {
    const base = ["medical", "waiver", "boat"];
    const perCenter = centers.length > 1
      ? [...base, ...base] // duplicate for second center
      : base;

    const all = [...perCenter, "rdc"]; // RDC once
    if (isMinor) all.push("youth");
    return all;
  },
  // Label suffixes for filenames when both centers are selected
  centerSuffixes(centers) {
    if (centers.length < 2) return [centers[0] || "Havelock"];
    return ["Havelock", "Neil"]; // order them nicely
  }
};