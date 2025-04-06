import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";

interface InventoryItem {
  id: number;
  machine: string;
  item: string;
  cost: number;
  stock: number;
}

interface LogEntry {
  time: string;
  item: string;
  type: "出貨" | "夾換";
  quantity: number;
}

export default function InventoryDashboard() {
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [exchangeFile, setExchangeFile] = useState<File | null>(null);
  const [data, setData] = useState<InventoryItem[]>([ 
    { id: 1, machine: "A01", item: "吉伊卡哇童巾", cost: 12, stock: 50 },
    { id: 2, machine: "A02", item: "滿天星洋芋片", cost: 15, stock: 32 },
    { id: 3, machine: "B01", item: "鯊魚手偶", cost: 40, stock: 12 },
    { id: 4, machine: "C03", item: "夾子園聯名奶茶", cost: 20, stock: 21 },
  ]);
  const [log, setLog] = useState<LogEntry[]>([]);

  const filtered = data.filter(
    (item) =>
      item.machine.includes(search) ||
      item.item.includes(search)
  );

  const handleExportLog = () => {
    const ws = XLSX.utils.json_to_sheet(log);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "每日進出明細");
    XLSX.writeFile(wb, "每日進出明細.csv");
  };

  const handleDeleteLog = (index: number) => {
    const updatedLog = [...log];
    updatedLog.splice(index, 1);
    setLog(updatedLog);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const binaryStr = e.target?.result;
      if (!binaryStr) return;
      const wb = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      const updatedData = [...data];
      const updatedLog = [...log];
      const now = new Date().toLocaleString();

      rows.forEach((row) => {
        const itemName = row["品名"] || row["品項"] || row["商品"] || "";
        const quantity = Number(row["出貨數量"] || row["數量"] || row["數量小計"] || 0);
        const match = updatedData.find((item) => item.item === itemName);
        if (match) match.stock -= quantity;
        updatedLog.push({ time: now, item: itemName, type: "出貨", quantity });
      });

      setData(updatedData);
      setLog(updatedLog);
      alert("📤 出貨資料已更新庫存");
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleExchangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setExchangeFile(e.target.files[0]);
    }
  };

  const handleExchangeUpload = () => {
    if (!exchangeFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const binaryStr = e.target?.result;
      if (!binaryStr) return;
      const wb = XLSX.read(binaryStr, { type: "binary" });
      const sheetName = wb.SheetNames.includes("資料區") ? "資料區" : wb.SheetNames[0];
      const sheet = wb.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      const updatedData = [...data];
      const updatedLog = [...log];
      const now = new Date().toLocaleString();

      rows.forEach((row) => {
        const itemName = row["品名"] || row["品項"] || row["商品"] || "";
        const quantity = Number(row["數量"] || row["回收數量"] || row["夾換數"] || 0);
        const match = updatedData.find((item) => item.item === itemName);
        if (match) match.stock += quantity;
        updatedLog.push({ time: now, item: itemName, type: "夾換", quantity });
      });

      setData(updatedData);
      setLog(updatedLog);
      alert("🔁 夾換利潤表已更新庫存");
    };
    reader.readAsBinaryString(exchangeFile);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📦 目前庫存狀況</h1>

      <Input
        placeholder="搜尋機台號碼或品名..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full md:w-1/2"
      />
  );
}
