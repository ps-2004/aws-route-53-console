import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  Search, 
  RefreshCw, 
  Filter, 
  Download, 
  Upload, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft,
  FileCode,
  Layers,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { HostedZone, DnsRecord, PaginatedResponse, RecordType } from '../../types/route53';
import { api } from '../../services/api';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { RecordModal } from './RecordModal';
import { ZoneDetailsTab } from './ZoneDetailsTab';
import { CreateHostedZoneModal } from '../zones/CreateHostedZoneModal';

interface RecordsListProps {
  zone: HostedZone;
  onBack: () => void;
  showToast: (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string }) => void;
  onRefreshZone: () => void;
}

const RECORD_TYPES: { label: string; value: string }[] = [
  { label: 'All types', value: 'ALL' },
  { label: 'A', value: 'A' },
  { label: 'AAAA', value: 'AAAA' },
  { label: 'CNAME', value: 'CNAME' },
  { label: 'TXT', value: 'TXT' },
  { label: 'MX', value: 'MX' },
  { label: 'NS', value: 'NS' },
  { label: 'PTR', value: 'PTR' },
  { label: 'SRV', value: 'SRV' },
  { label: 'CAA', value: 'CAA' },
  { label: 'SOA', value: 'SOA' },
];

export const RecordsList: React.FC<RecordsListProps> = ({
  zone,
  onBack,
  showToast,
  onRefreshZone,
}) => {
  // Tabs
  const [activeTab, setActiveTab] = useState<'records' | 'details'>('records');

  // State
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);
  const [copiedZoneId, setCopiedZoneId] = useState(false);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isEditZoneOpen, setIsEditZoneOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const selectedRecord = records.find((r) => r.id === selectedRecordIds[0]) || null;

  const loadRecords = async (
    currentPage = page,
    currentSearch = search,
    currentType = typeFilter,
    currentLimit = limit
  ) => {
    setLoading(true);
    try {
      const data: PaginatedResponse<DnsRecord> = await api.getRecords(
        zone.id,
        currentPage,
        currentLimit,
        currentSearch,
        currentType
      );
      setRecords(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
      setPage(data.page);
      // Clean selected records if not in new list
      setSelectedRecordIds((prev) => prev.filter((id) => data.items.some((r) => r.id === id)));
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error loading records',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords(1, search, typeFilter, limit);
  }, [typeFilter, limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadRecords(1, search, typeFilter, limit);
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
    loadRecords(1, '', typeFilter, limit);
  };

  const toggleSelectRecord = (id: number) => {
    setSelectedRecordIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedRecordIds.length === records.length) {
      setSelectedRecordIds([]);
    } else {
      setSelectedRecordIds(records.map((r) => r.id));
    }
  };

  const handleCreateRecord = async (payload: Partial<DnsRecord>) => {
    const created = await api.createRecord(zone.id, payload);
    showToast({
      type: 'success',
      title: 'Record created',
      message: `Created ${created.type} record for ${created.name}`,
    });
    onRefreshZone();
    loadRecords(1, search, typeFilter, limit);
  };

  const handleEditRecord = async (payload: Partial<DnsRecord>) => {
    if (!selectedRecord) return;
    const updated = await api.updateRecord(selectedRecord.id, payload);
    showToast({
      type: 'success',
      title: 'Record updated',
      message: `Updated ${updated.type} record for ${updated.name}`,
    });
    loadRecords(page, search, typeFilter, limit);
  };

  const handleDeleteRecord = async () => {
    if (!selectedRecord) return;
    setActionLoading(true);
    try {
      await api.deleteRecord(selectedRecord.id);
      showToast({
        type: 'success',
        title: 'Record deleted',
        message: `Deleted record ${selectedRecord.name} (${selectedRecord.type})`,
      });
      setIsDeleteOpen(false);
      setSelectedRecordIds([]);
      onRefreshZone();
      loadRecords(page > 1 && records.length === 1 ? page - 1 : page, search, typeFilter, limit);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Failed to delete record',
        message: err.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRecordIds.length === 0) return;
    setActionLoading(true);
    try {
      const res = await api.bulkDeleteRecords(selectedRecordIds);
      showToast({
        type: 'success',
        title: 'Bulk deletion completed',
        message: res.message,
      });
      setIsBulkDeleteOpen(false);
      setSelectedRecordIds([]);
      onRefreshZone();
      loadRecords(1, search, typeFilter, limit);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Bulk delete failed',
        message: err.message,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'bind') => {
    try {
      const data = await api.exportZone(zone.id, format);
      const blob = new Blob(
        [format === 'json' ? JSON.stringify(data, null, 2) : data],
        { type: format === 'json' ? 'application/json' : 'text/plain' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${zone.name}_records.${format === 'json' ? 'json' : 'zone'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast({
        type: 'success',
        title: 'Export successful',
        message: `Exported zone records as ${format.toUpperCase()}`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Export error',
        message: err.message,
      });
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(importJson);
      const recordsToImport = Array.isArray(parsed) ? parsed : parsed.records;
      if (!Array.isArray(recordsToImport)) {
        throw new Error('JSON must contain an array of record objects');
      }
      const res = await api.importRecords(zone.id, recordsToImport);
      showToast({
        type: 'success',
        title: 'Import completed',
        message: res.message,
      });
      setIsImportOpen(false);
      setImportJson('');
      onRefreshZone();
      loadRecords(1, search, typeFilter, limit);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Import failed',
        message: err.message || 'Invalid JSON format',
      });
    }
  };

  const getTypeBadgeClass = (type: RecordType) => {
    switch (type) {
      case 'A':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'AAAA':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'CNAME':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'TXT':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'MX':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'NS':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'SRV':
        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
      case 'CAA':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'SOA':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Zone Header Banner */}
      <div className="bg-white border border-[#eaeded] shadow-sm rounded-sm p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <button
                onClick={onBack}
                className="text-[#545b64] hover:text-[#16191f] p-1 rounded hover:bg-[#eaeded] transition-colors"
                title="Back to hosted zones"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <h1 className="text-xl font-bold text-[#16191f] tracking-tight flex items-center space-x-2">
                <span>{zone.name}</span>
                <span className="text-xs font-normal text-[#687078] bg-[#eaeded] px-2 py-0.5 rounded">
                  {zone.zone_type}
                </span>
              </h1>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 sm:gap-x-4 gap-y-1 text-xs text-[#545b64] pl-0 sm:pl-7">
              <div className="flex items-center space-x-1.5">
                <span>Hosted zone ID:</span>
                <span className="font-mono text-[#16191f] font-semibold">{zone.zone_id}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(zone.zone_id);
                    setCopiedZoneId(true);
                    setTimeout(() => setCopiedZoneId(false), 2000);
                  }}
                  className="p-0.5 text-[#879596] hover:text-[#16191f]"
                  title="Copy Zone ID"
                >
                  {copiedZoneId ? <Check className="w-3 h-3 text-[#1d8102]" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <span>•</span>
              <div>
                <span>Records: </span>
                <span className="font-semibold text-[#16191f]">{zone.record_count}</span>
              </div>

              {zone.description && (
                <>
                  <span className="hidden sm:inline">•</span>
                  <div className="italic text-[#687078] truncate max-w-xs">{zone.description}</div>
                </>
              )}
            </div>
          </div>

          {/* Quick Action */}
          <div className="flex items-center space-x-2 pl-0 sm:pl-0">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="w-full sm:w-auto px-4 py-1.5 rounded-sm bg-[#ec7211] hover:bg-[#eb5f07] font-bold text-white text-xs transition-colors shadow-sm flex items-center justify-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create record</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-6 border-b border-[#eaeded] mt-4 -mb-4 text-xs font-bold overflow-x-auto whitespace-nowrap">
          <button
            onClick={() => setActiveTab('records')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'records'
                ? 'border-[#0073bb] text-[#0073bb]'
                : 'border-transparent text-[#545b64] hover:text-[#16191f]'
            }`}
          >
            Records ({zone.record_count})
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 transition-colors border-b-2 ${
              activeTab === 'details'
                ? 'border-[#0073bb] text-[#0073bb]'
                : 'border-transparent text-[#545b64] hover:text-[#16191f]'
            }`}
          >
            Hosted zone details
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' ? (
        <ZoneDetailsTab
          zone={zone}
          records={records}
          onEditZone={() => setIsEditZoneOpen(true)}
          showToast={showToast}
        />
      ) : (
        <div className="bg-white border border-[#eaeded] shadow-sm rounded-sm">
          {/* Records Toolbar */}
          <div className="p-3 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3 bg-[#fafafa]">
            {/* Left Actions */}
            <div className="flex items-center flex-wrap gap-2">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-3 py-1.5 rounded-sm bg-[#ec7211] hover:bg-[#eb5f07] font-bold text-white text-xs transition-colors flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create record</span>
              </button>

              <button
                onClick={() => setIsEditOpen(true)}
                disabled={selectedRecordIds.length !== 1}
                className="px-3 py-1.5 rounded-sm border border-[#545b64] text-[#16191f] font-semibold text-xs hover:bg-[#eaeded] disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center space-x-1"
              >
                <Edit className="w-3.5 h-3.5 text-[#545b64]" />
                <span>Edit record</span>
              </button>

              <button
                onClick={() => {
                  if (selectedRecordIds.length === 1) {
                    setIsDeleteOpen(true);
                  } else if (selectedRecordIds.length > 1) {
                    setIsBulkDeleteOpen(true);
                  }
                }}
                disabled={selectedRecordIds.length === 0}
                className="px-3 py-1.5 rounded-sm border border-[#d13212] text-[#d13212] font-semibold text-xs hover:bg-[#fdf2f2] disabled:opacity-40 disabled:border-[#545b64] disabled:text-[#545b64] disabled:hover:bg-transparent transition-colors flex items-center space-x-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {selectedRecordIds.length > 1
                    ? `Delete records (${selectedRecordIds.length})`
                    : 'Delete record'}
                </span>
              </button>

              <div className="h-4 w-px bg-[#eaeded] hidden sm:block mx-1"></div>

              {/* Import / Export */}
              <button
                onClick={() => handleExport('json')}
                className="px-2.5 py-1.5 rounded-sm border border-[#aab7b8] text-[#545b64] hover:text-[#16191f] text-xs hover:bg-[#eaeded] transition-colors flex items-center space-x-1"
                title="Export records as JSON"
              >
                <Download className="w-3 h-3" />
                <span>Export JSON</span>
              </button>

              <button
                onClick={() => handleExport('bind')}
                className="px-2.5 py-1.5 rounded-sm border border-[#aab7b8] text-[#545b64] hover:text-[#16191f] text-xs hover:bg-[#eaeded] transition-colors flex items-center space-x-1"
                title="Export as BIND zone file"
              >
                <FileCode className="w-3 h-3" />
                <span>Export BIND</span>
              </button>

              <button
                onClick={() => setIsImportOpen(true)}
                className="px-2.5 py-1.5 rounded-sm border border-[#aab7b8] text-[#545b64] hover:text-[#16191f] text-xs hover:bg-[#eaeded] transition-colors flex items-center space-x-1"
                title="Import records"
              >
                <Upload className="w-3 h-3" />
                <span>Import JSON</span>
              </button>
            </div>

            {/* Right: Search, Filter & Refresh */}
            <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto">
              {/* Type Filter */}
              <div className="flex items-center space-x-1">
                <span className="text-xs text-[#545b64]">Type:</span>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="border border-[#aab7b8] rounded px-2 py-1 text-xs bg-white text-[#16191f] outline-none"
                >
                  {RECORD_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#879596]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Find records by name or value"
                  className="w-full bg-white border border-[#aab7b8] focus:border-[#ec7211] rounded px-3 py-1 pl-8 text-xs text-[#16191f] outline-none"
                />
                {search && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#879596] hover:text-[#16191f]"
                  >
                    Clear
                  </button>
                )}
              </form>

              <button
                onClick={() => loadRecords(page, search, typeFilter, limit)}
                disabled={loading}
                className="p-1.5 border border-[#aab7b8] rounded text-[#545b64] hover:text-[#16191f] hover:bg-[#eaeded] transition-colors"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#ec7211]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[720px] text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] uppercase text-[11px] font-bold">
                  <th className="py-2.5 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={records.length > 0 && selectedRecordIds.length === records.length}
                      onChange={toggleSelectAll}
                      className="rounded text-[#0073bb] focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-2.5 px-3">Record name</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Routing policy</th>
                  <th className="py-2.5 px-3">Differentiator</th>
                  <th className="py-2.5 px-3">Alias</th>
                  <th className="py-2.5 px-3">Value/Route traffic to</th>
                  <th className="py-2.5 px-3">TTL (Seconds)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eaeded]">
                {loading ? (
                  Array.from({ length: 4 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-3 px-3 text-center">
                        <div className="w-4 h-4 bg-[#eaeded] rounded mx-auto"></div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="h-3.5 w-32 bg-[#eaeded] rounded"></div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="h-3.5 w-12 bg-[#eaeded] rounded"></div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="h-3.5 w-16 bg-[#eaeded] rounded"></div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="h-3.5 w-8 bg-[#eaeded] rounded"></div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="h-3.5 w-8 bg-[#eaeded] rounded"></div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="h-3.5 w-48 bg-[#eaeded] rounded"></div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="h-3.5 w-12 bg-[#eaeded] rounded"></div>
                      </td>
                    </tr>
                  ))
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-[#545b64]">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-[#f2f3f3] text-[#879596] flex items-center justify-center mx-auto">
                          <Layers className="w-6 h-6" />
                        </div>
                        <p className="font-bold text-sm text-[#16191f]">No records found</p>
                        <p className="text-xs text-[#687078]">
                          {search || typeFilter !== 'ALL'
                            ? 'No records match your filter criteria.'
                            : 'This hosted zone currently has no custom records.'}
                        </p>
                        {search || typeFilter !== 'ALL' ? (
                          <button
                            onClick={() => {
                              setSearch('');
                              setTypeFilter('ALL');
                              loadRecords(1, '', 'ALL', limit);
                            }}
                            className="px-3 py-1.5 border border-[#545b64] rounded text-xs font-semibold hover:bg-[#eaeded]"
                          >
                            Reset filters
                          </button>
                        ) : (
                          <button
                            onClick={() => setIsCreateOpen(true)}
                            className="px-4 py-1.5 rounded-sm bg-[#ec7211] font-bold text-white text-xs hover:bg-[#eb5f07]"
                          >
                            Create record
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  records.map((rec) => {
                    const isSelected = selectedRecordIds.includes(rec.id);
                    return (
                      <tr
                        key={rec.id}
                        onClick={() => toggleSelectRecord(rec.id)}
                        className={`hover:bg-[#f8f9fa] cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#ebf3fc]' : ''
                        }`}
                      >
                        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectRecord(rec.id)}
                            className="rounded text-[#0073bb] focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* Name */}
                        <td className="py-3 px-3 font-semibold text-[#16191f]">
                          {rec.name}
                        </td>

                        {/* Type */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2 py-0.5 rounded font-mono font-bold text-[11px] border ${getTypeBadgeClass(
                              rec.type
                            )}`}
                          >
                            {rec.type}
                          </span>
                        </td>

                        {/* Routing policy */}
                        <td className="py-3 px-3 text-[#545b64]">
                          {rec.routing_policy || 'Simple'}
                        </td>

                        {/* Differentiator */}
                        <td className="py-3 px-3 text-[#879596]">-</td>

                        {/* Alias */}
                        <td className="py-3 px-3 text-[#545b64]">No</td>

                        {/* Value / Route traffic to */}
                        <td className="py-3 px-3 max-w-md font-mono text-[11px] text-[#16191f]">
                          {rec.type === 'MX' && rec.priority !== null && (
                            <span className="font-bold text-[#ec7211] mr-1">
                              [{rec.priority}]
                            </span>
                          )}
                          {rec.type === 'SRV' && (
                            <span className="font-bold text-[#0073bb] mr-1">
                              [{rec.priority} {rec.weight} {rec.port}]
                            </span>
                          )}
                          {rec.type === 'CAA' && (
                            <span className="font-bold text-[#1d8102] mr-1">
                              [{rec.flags} {rec.tag}]
                            </span>
                          )}
                          <div className="whitespace-pre-line leading-relaxed">
                            {rec.value}
                          </div>
                        </td>

                        {/* TTL */}
                        <td className="py-3 px-3 font-mono text-[#545b64]">
                          {rec.ttl}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination & Footer */}
          <div className="p-3 border-t border-[#eaeded] bg-[#fafafa] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#545b64]">
            <div>
              Showing <span className="font-semibold text-[#16191f]">{records.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
              <span className="font-semibold text-[#16191f]">{Math.min(page * limit, total)}</span> of{' '}
              <span className="font-semibold text-[#16191f]">{total}</span> records
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1.5">
                <span>Rows per page:</span>
                <select
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="border border-[#aab7b8] rounded px-2 py-1 text-xs bg-white text-[#16191f] outline-none"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => {
                    const nextP = page - 1;
                    setPage(nextP);
                    loadRecords(nextP, search, typeFilter, limit);
                  }}
                  disabled={page <= 1 || loading}
                  className="px-2 py-1 border border-[#aab7b8] rounded hover:bg-[#eaeded] disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center space-x-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>

                <span className="px-2 text-xs font-semibold text-[#16191f]">
                  {page} / {totalPages || 1}
                </span>

                <button
                  onClick={() => {
                    const nextP = page + 1;
                    setPage(nextP);
                    loadRecords(nextP, search, typeFilter, limit);
                  }}
                  disabled={page >= totalPages || loading}
                  className="px-2 py-1 border border-[#aab7b8] rounded hover:bg-[#eaeded] disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <RecordModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        zone={zone}
        onSubmit={handleCreateRecord}
      />

      <RecordModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        zone={zone}
        editRecord={selectedRecord}
        onSubmit={handleEditRecord}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete record"
        message={`Are you sure you want to delete the ${selectedRecord?.type} record for "${selectedRecord?.name}"? Traffic routing to this resource will stop immediately.`}
        resourceName={`${selectedRecord?.name} (${selectedRecord?.type})`}
        requireTypingConfirm={false}
        confirmButtonText="Delete record"
        isDestructive={true}
        isLoading={actionLoading}
        onConfirm={handleDeleteRecord}
        onCancel={() => setIsDeleteOpen(false)}
      />

      <ConfirmDialog
        isOpen={isBulkDeleteOpen}
        title="Delete multiple records"
        message={`Are you sure you want to permanently delete the ${selectedRecordIds.length} selected records? This action cannot be undone.`}
        requireTypingConfirm={true}
        resourceName="delete"
        confirmButtonText={`Delete ${selectedRecordIds.length} records`}
        isDestructive={true}
        isLoading={actionLoading}
        onConfirm={handleBulkDelete}
        onCancel={() => setIsBulkDeleteOpen(false)}
      />

      <CreateHostedZoneModal
        isOpen={isEditZoneOpen}
        onClose={() => setIsEditZoneOpen(false)}
        editZone={zone}
        onSubmit={async (payload) => {
          await api.updateHostedZone(zone.id, payload);
          showToast({
            type: 'success',
            title: 'Hosted zone updated',
            message: 'Changes saved.',
          });
          onRefreshZone();
        }}
      />

      {/* Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[1px] animate-in fade-in duration-150">
          <div className="bg-white border border-[#eaeded] shadow-2xl rounded-sm w-full max-w-xl text-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#eaeded] flex items-center justify-between bg-[#fafafa]">
              <h3 className="font-bold text-sm text-[#16191f]">Import DNS records (JSON)</h3>
              <button
                onClick={() => setIsImportOpen(false)}
                className="text-[#687078] hover:text-[#16191f] p-1 rounded"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleImportSubmit} className="p-5 space-y-3">
              <p className="text-[#545b64]">
                Paste a JSON array of records to import into <span className="font-bold font-mono">{zone.name}</span>:
              </p>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder={`[\n  { "name": "sub", "type": "A", "ttl": 300, "value": "1.2.3.4" },\n  { "name": "mail", "type": "MX", "ttl": 300, "value": "smtp.example.com", "priority": 10 }\n]`}
                rows={8}
                className="w-full border border-[#aab7b8] rounded p-2.5 font-mono text-xs outline-none focus:border-[#ec7211]"
                required
              />
              <div className="flex justify-end space-x-2 pt-2 border-t border-[#eaeded]">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="px-4 py-1.5 border border-[#545b64] rounded text-xs font-semibold hover:bg-[#eaeded]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#ec7211] hover:bg-[#eb5f07] text-white rounded text-xs font-bold"
                >
                  Import records
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
