import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export async function exportChatToPdf(
  messages: { role: string; content: string; timestamp?: string | Date }[],
  title: string = "ShadowTalk AI - Chat Log",
) {
  const doc = new jsPDF();
  const dateStr = new Date().toLocaleDateString();

  // Add Header
  doc.setFontSize(20);
  doc.setTextColor(6, 182, 212); // Cyber Cyan
  doc.text("ShadowTalk AI", 14, 22);

  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`Conversation: ${title}`, 14, 32);
  doc.text(`Exported on: ${dateStr}`, 14, 40);

  // Table Data
  const tableData = messages.map((m) => {
    const isUser = m.role === "user";
    return [
      isUser ? "You" : "ShadowTalk",
      m.content,
    ];
  });

  autoTable(doc, {
    startY: 45,
    head: [["Sender", "Message"]],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [15, 23, 42], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 30, fontStyle: "bold" },
      1: { cellWidth: 150 },
    },
    styles: { fontSize: 10, cellPadding: 4 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  });

  doc.save(`ShadowTalk_${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`);
}
