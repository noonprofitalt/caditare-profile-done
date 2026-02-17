import { StyleSheet } from '@react-pdf/renderer';

// Register fonts (Standard PDF fonts are available by default)

export const styles = StyleSheet.create({
  // 1️⃣ PURE A4 LAYOUT RESET
  page: {
    paddingTop: 45,
    paddingBottom: 60,
    paddingLeft: 45,
    paddingRight: 45,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#0c0a09',
    backgroundColor: '#FFFFFF',
    position: 'relative',
  },

  // 2️⃣ CLEAN HEADER (NO DIVIDERS - 45/55 Split for BIG LOGO)
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#1e1b4b',
    paddingBottom: 8,
    width: '100%',
  },
  headerLeft: {
    width: '50%',
    alignItems: 'flex-start',
  },
  headerRight: {
    width: '50%',
    alignItems: 'flex-end',
    justifyContent: 'center',
  },

  // 3️⃣ EMBASSY TYPOGRAPHY - HIERARCHY
  suharaTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16, // Authoritative
    color: '#1e1b4b', // Deep Indigo
    textTransform: 'uppercase',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  licenseNo: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 10,
    color: '#334155', // Slate
    marginBottom: 6,
  },
  contactBox: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: '#334155',
    lineHeight: 1.4,
  },

  // 4️⃣ DOCUMENT TITLE
  reportTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16,
    color: '#000000',
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 8,
    marginTop: 8,
    letterSpacing: 2,
    borderTopWidth: 2,
    borderTopColor: '#1e1b4b',
    borderBottomWidth: 2,
    borderBottomColor: '#1e1b4b',
    paddingVertical: 10,
  },

  // 5️⃣ META DATA ROW
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: '6 10',
    marginBottom: 25,
  },
  metaText: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: '#64748b',
  },

  // 6️⃣ SECTION HEADERS
  h1: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 6, textTransform: 'uppercase', color: '#000' },
  h2: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 8,
    marginTop: 12,
    textTransform: 'uppercase',
    color: '#000000',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000',
    paddingBottom: 4,
  },
  h3: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 3,
    marginTop: 5,
    textTransform: 'uppercase',
    color: '#000000',
  },

  // 7️⃣ STANDARD TEXT
  text: {
    fontSize: 10,
    fontFamily: 'Times-Roman',
    lineHeight: 1.4,
    color: '#000000',
    marginBottom: 4,
  },
  small: {
    fontSize: 9,
    fontFamily: 'Times-Roman',
    color: '#000000',
  },
  bold: { fontFamily: 'Times-Bold' },
  label: { fontSize: 9, fontFamily: 'Helvetica-Bold', width: 110 },
  value: { fontSize: 10, fontFamily: 'Times-Roman', flex: 1 },

  // 8️⃣ TABLES (Strict Grid)
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#000000',
    marginTop: 5,
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    minHeight: 20,
    alignItems: 'center',
  },
  tableHeader: {
    backgroundColor: '#f8fafc',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    padding: 4,
    textTransform: 'uppercase',
  },
  tableCell: {
    padding: 6,
    borderRightWidth: 1,
    borderRightColor: '#000000',
    fontSize: 9,
    fontFamily: 'Helvetica',
  },
  lastCell: { borderRightWidth: 0 },

  // 9️⃣ UTILS
  section: { marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 3 },
  grid2: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  gridItem2: {
    width: '48%',
    marginBottom: 8,
  },
  bgGray: { backgroundColor: '#f3f4f6' },

  // 🔟 BULLETPROOF FOOTER (Absolute Bottom)
  footer: {
    position: 'absolute',
    bottom: 25, // Inside the safe 90pt padding zone
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#0f172a',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100, // Top Layer
  },
  footerText: {
    fontSize: 8,
    color: '#334155', // Slate
    fontFamily: 'Helvetica',
  },
  pageNumber: {
    fontSize: 8,
    color: '#334155',
    fontFamily: 'Helvetica',
  },

  // 1️⃣1️⃣ WATERMARK (Background Layer)
  watermarkContainer: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center',
    zIndex: -1, // Behind everything
  },
  watermarkImage: {
    width: 650,
    opacity: 0.05,
    transform: 'rotate(-45deg)',
  },
  watermarkText: {
    position: 'absolute',
    bottom: 20, // Absolute bottom center
    left: 45,
    right: 45,
    textAlign: 'center',
    fontSize: 8,
    color: '#cbd5e1', // Very faint grey
    fontFamily: 'Helvetica',
  },
  // 1️⃣2️⃣ ASSESSMENT STYLES
  assessmentBox: {
    padding: 10,
    backgroundColor: '#f8fafc', // Soft Gray
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
    marginBottom: 10,
  },
  ratingProgressBar: {
    height: 8,
    width: '100%',
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 4,
  },
  ratingProgressFill: {
    height: '100%',
    backgroundColor: '#0f172a', // Navy
  },
  riskBadgeLow: { backgroundColor: '#dcfce7', color: '#166534', padding: '2 6', borderRadius: 4, fontSize: 8, fontFamily: 'Helvetica-Bold' },
  riskBadgeMed: { backgroundColor: '#fef9c3', color: '#854d0e', padding: '2 6', borderRadius: 4, fontSize: 8, fontFamily: 'Helvetica-Bold' },
  riskBadgeHigh: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '2 6', borderRadius: 4, fontSize: 8, fontFamily: 'Helvetica-Bold' },
  insightPoint: { marginBottom: 3, flexDirection: 'row', alignItems: 'flex-start' },
  insightBullet: { width: 8, height: 8, backgroundColor: '#3b82f6', borderRadius: 4, marginTop: 4, marginRight: 6 }

});
