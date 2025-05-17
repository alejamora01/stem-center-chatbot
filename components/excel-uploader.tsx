"use client"

import type React from "react"

import { useState } from "react"
import { Upload, FileText, Check, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function ExcelUploader({ onFileUploaded }: { onFileUploaded: (file: File) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    validateAndSetFile(droppedFile)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0])
    }
  }

  const validateAndSetFile = (file: File) => {
    setError(null)

    // Check if it's an Excel file
    const validExcelTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel.sheet.macroEnabled.12",
    ]

    if (!validExcelTypes.includes(file.type)) {
      setError("Please upload a valid Excel file (.xls, .xlsx)")
      return
    }

    setFile(file)
  }

  const handleUpload = () => {
    if (file) {
      onFileUploaded(file)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-[#990000]">Upload Excel File</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center ${
            isDragging ? "border-[#990000] bg-red-50" : "border-gray-300"
          } ${error ? "border-red-500" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="rounded-full bg-gray-100 p-3">
              <Upload className="h-6 w-6 text-gray-500" />
            </div>
            <div>
              <p className="text-sm text-gray-500">
                Drag and drop your Excel file here, or{" "}
                <label className="text-[#990000] hover:underline cursor-pointer">
                  browse
                  <input type="file" className="hidden" accept=".xls,.xlsx,.xlsm" onChange={handleFileChange} />
                </label>
              </p>
              <p className="text-xs text-gray-400 mt-1">Supports .xls, .xlsx, and .xlsm files</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-center text-red-500 text-sm">
            <AlertCircle className="h-4 w-4 mr-2" />
            {error}
          </div>
        )}

        {file && !error && (
          <div className="mt-4 flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-gray-500 mr-2" />
              <div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
            <Check className="h-5 w-5 text-green-500" />
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" disabled={!file || !!error} onClick={handleUpload}>
          Upload and Process
        </Button>
      </CardFooter>
    </Card>
  )
}
