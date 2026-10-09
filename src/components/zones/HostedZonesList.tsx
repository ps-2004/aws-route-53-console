import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit, 
  ExternalLink, 
  RefreshCw, 
  Search, 
  Globe, 
  Lock, 
  Download, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Info,
  CheckCircle2,
  FileCode,
  Layers
} from 'lucide-react';
import { HostedZone, PaginatedResponse } from '../../types/route53';
import { api } from '../../services/api';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { CreateHostedZoneModal } from './CreateHostedZoneModal';

interface HostedZonesListProps {
  onSelectZone: (zone: HostedZone) => void;
  showToast: (toast: { type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string }) => void;
  onRefreshCount: () => void;
}

export const HostedZonesList: React.FC<HostedZonesListProps> = ({
  onSelectZone,
  showToast,
  onRefreshCount,
}) => {
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const selectedZone = zones.find((z) => z.id === selectedZoneId) || null;

  const loadZones = async (currentPage = page, currentSearch = search, currentLimit = limit) => {
    setLoading(true);
    try {
      const data: PaginatedResponse<HostedZone> = await api.getHostedZones(currentPage, currentLimit, currentSearch);
      setZones(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
      setPage(data.page);
      onRefreshCount();
      // If previous selection is no longer in current items, reset selection
      if (selectedZoneId && !data.items.some((z) => z.id === selectedZoneId)) {
        setSelectedZoneId(null);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Error loading hosted zones',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadZones(1, search, limit);
  }, [limit]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadZones(1, search, limit);
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
    loadZones(1, '', limit);
  };

  const handleCreateZone = async (payload: { name: string; description: string; zone_type: string; private_zone: boolean }) => {
    const created = await api.createHostedZone(payload);
    showToast({
      type: 'success',
      title: 'Hosted zone created successfully',
      message: `Created ${created.name} (${created.zone_id}) with default NS and SOA records.`,
    });
    loadZones(1, search, limit);
  };

  const handleEditZone = async (payload: { name: string; description: string; zone_type: string; private_zone: boolean }) => {
    if (!selectedZone) return;
    const updated = await api.updateHostedZone(selectedZone.id, {
      description: payload.description,
      zone_type: payload.zone_type,
      private_zone: payload.private_zone,
    });
    showToast({
      type: 'success',
      title: 'Hosted zone updated',
      message: `Updated configuration for ${updated.name}.`,
    });
    loadZones(page, search, limit);
  };

  const handleDeleteZone = async () => {
    if (!selectedZone) return;
    setDeleteLoading(true);
    try {
      await api.deleteHostedZone(selectedZone.id);
      showToast({
        type: 'success',
        title: 'Hosted zone deleted',
        message: `Successfully deleted ${selectedZone.name} and all its records.`,
      });
      setIsDeleteOpen(false);
      setSelectedZoneId(null);
      loadZones(page > 1 && zones.length === 1 ? page - 1 : page, search, limit);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Failed to delete hosted zone',
        message: err.message,
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'bind') => {
    if (!selectedZone) return;
    try {
      const data = await api.exportZone(selectedZone.id, format);
      const blob = new Blob(
        [format === 'json' ? JSON.stringify(data, null, 2) : data],
        { type: format === 'json' ? 'application/json' : 'text/plain' }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedZone.name}_zone.${format === 'json' ? 'json' : 'zone'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast({
        type: 'success',
        title: 'Zone exported',
        message: `Exported ${selectedZone.name} as ${format.toUpperCase()}`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Export failed',
        message: err.message,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Title & Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#eaeded]">
        <div>
          <h1 className="text-xl font-bold text-[#16191f] tracking-tight">Hosted zones</h1>
          <p className="text-xs text-[#545b64] mt-0.5">
            A hosted zone contains records that define how you want traffic to be routed on the Internet or within VPCs.
          </p>
        </div>

        {/* Global Action Button */}
        <div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto px-4 py-1.5 rounded-sm bg-[#ec7211] hover:bg-[#eb5f07] font-bold text-white text-xs transition-colors shadow-sm flex items-center justify-center space-x-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create hosted zone</span>
          </button>
        </div>
      </div>

      {/* Main Table Container Card */}
      <div className="bg-white border border-[#eaeded] shadow-sm rounded-sm">
        {/* Table Toolbar / Actions */}
        <div className="p-3 border-b border-[#eaeded] flex flex-wrap items-center justify-between gap-3 bg-[#fafafa]">
          {/* Left: Selected actions */}
          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => selectedZone && onSelectZone(selectedZone)}
              disabled={!selectedZone}
              className="px-3 py-1.5 rounded-sm border border-[#545b64] text-[#16191f] font-semibold text-xs hover:bg-[#eaeded] disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center space-x-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#545b64]" />
              <span>Go to records</span>
            </button>

            <button
              onClick={() => setIsEditOpen(true)}
              disabled={!selectedZone}
              className="px-3 py-1.5 rounded-sm border border-[#545b64] text-[#16191f] font-semibold text-xs hover:bg-[#eaeded] disabled:opacity-40 disabled:hover:bg-transparent transition-colors flex items-center space-x-1.5"
            >
              <Edit className="w-3.5 h-3.5 text-[#545b64]" />
              <span>Edit</span>
            </button>

            <button
              onClick={() => setIsDeleteOpen(true)}
              disabled={!selectedZone}
              className="px-3 py-1.5 rounded-sm border border-[#d13212] text-[#d13212] font-semibold text-xs hover:bg-[#fdf2f2] disabled:opacity-40 disabled:border-[#545b64] disabled:text-[#545b64] disabled:hover:bg-transparent transition-colors flex items-center space-x-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>

            <div className="h-4 w-px bg-[#eaeded] hidden sm:block mx-1"></div>

            {/* Export dropdown / buttons */}
            <button
              onClick={() => handleExport('json')}
              disabled={!selectedZone}
              className="px-2.5 py-1.5 rounded-sm border border-[#aab7b8] text-[#545b64] hover:text-[#16191f] text-xs hover:bg-[#eaeded] disabled:opacity-40 transition-colors flex items-center space-x-1"
              title="Export Zone as JSON"
            >
              <Download className="w-3 h-3" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={() => handleExport('bind')}
              disabled={!selectedZone}
              className="px-2.5 py-1.5 rounded-sm border border-[#aab7b8] text-[#545b64] hover:text-[#16191f] text-xs hover:bg-[#eaeded] disabled:opacity-40 transition-colors flex items-center space-x-1"
              title="Export Zone as BIND zone file"
            >
              <FileCode className="w-3 h-3" />
              <span>Export BIND</span>
            </button>
          </div>

          {/* Right: Search & Refresh */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#879596]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find hosted zones by domain name or ID"
                className="w-full bg-white border border-[#aab7b8] focus:border-[#ec7211] rounded px-3 py-1.5 pl-8 text-xs text-[#16191f] outline-none"
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
              onClick={() => loadZones(page, search, limit)}
              disabled={loading}
              className="p-1.5 border border-[#aab7b8] rounded text-[#545b64] hover:text-[#16191f] hover:bg-[#eaeded] transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#ec7211]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[680px] text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] uppercase text-[11px] font-bold">
                <th className="py-2.5 px-3 w-10 text-center"></th>
                <th className="py-2.5 px-3">Domain name</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Hosted zone ID</th>
                <th className="py-2.5 px-3">Record count</th>
                <th className="py-2.5 px-3">Comment / Description</th>
                <th className="py-2.5 px-3">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {loading ? (
                // Skeleton Rows
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-3 px-3 text-center">
                      <div className="w-4 h-4 rounded-full bg-[#eaeded] mx-auto"></div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-3.5 w-32 bg-[#eaeded] rounded"></div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-3.5 w-16 bg-[#eaeded] rounded"></div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-3.5 w-24 bg-[#eaeded] rounded"></div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-3.5 w-8 bg-[#eaeded] rounded"></div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-3.5 w-48 bg-[#eaeded] rounded"></div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="h-3.5 w-20 bg-[#eaeded] rounded"></div>
                    </td>
                  </tr>
                ))
              ) : zones.length === 0 ? (
                // Empty state
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#545b64]">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 rounded-full bg-[#f2f3f3] text-[#879596] flex items-center justify-center mx-auto">
                        <Globe className="w-6 h-6" />
                      </div>
                      <p className="font-bold text-sm text-[#16191f]">No hosted zones found</p>
                      <p className="text-xs text-[#687078]">
                        {search
                          ? `No hosted zones match your search query "${search}". Try clearing the filter.`
                          : 'Get started by creating a hosted zone for your domain name.'}
                      </p>
                      {search ? (
                        <button
                          onClick={handleClearSearch}
                          className="px-3 py-1.5 border border-[#545b64] rounded text-xs font-semibold hover:bg-[#eaeded]"
                        >
                          Clear search filter
                        </button>
                      ) : (
                        <button
                          onClick={() => setIsCreateOpen(true)}
                          className="px-4 py-1.5 rounded-sm bg-[#ec7211] font-bold text-white text-xs hover:bg-[#eb5f07]"
                        >
                          Create hosted zone
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                zones.map((zone) => {
                  const isSelected = selectedZoneId === zone.id;
                  const isPrivate = zone.private_zone === 1 || zone.zone_type === 'Private';

                  return (
                    <tr
                      key={zone.id}
                      onClick={() => setSelectedZoneId(zone.id)}
                      className={`hover:bg-[#f8f9fa] cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#ebf3fc]' : ''
                      }`}
                    >
                      {/* Radio Selection */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="radio"
                          name="selected_zone"
                          checked={isSelected}
                          onChange={() => setSelectedZoneId(zone.id)}
                          className="text-[#0073bb] focus:ring-0"
                        />
                      </td>

                      {/* Domain Name */}
                      <td className="py-3 px-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectZone(zone);
                          }}
                          className="font-semibold text-[#0073bb] hover:underline hover:text-[#005080] text-left flex items-center space-x-1.5"
                        >
                          <span>{zone.name}</span>
                        </button>
                      </td>

                      {/* Type */}
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-medium border ${
                            isPrivate
                              ? 'bg-[#f2f3f3] text-[#545b64] border-[#eaeded]'
                              : 'bg-[#f2f8f0] text-[#1d8102] border-[#1d8102]/20'
                          }`}
                        >
                          {isPrivate ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                          <span>{zone.zone_type}</span>
                        </span>
                      </td>

                      {/* Zone ID */}
                      <td className="py-3 px-3 font-mono text-[11px] text-[#16191f]">
                        {zone.zone_id}
                      </td>

                      {/* Record Count */}
                      <td className="py-3 px-3">
                        <span className="font-semibold bg-[#eaeded] text-[#16191f] px-2 py-0.5 rounded text-[11px]">
                          {zone.record_count}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-3 text-[#545b64] max-w-xs truncate" title={zone.description}>
                        {zone.description || '-'}
                      </td>

                      {/* Created At */}
                      <td className="py-3 px-3 text-[#687078] text-[11px] whitespace-nowrap">
                        {zone.created_at ? new Date(zone.created_at).toLocaleDateString() : '-'}
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
            Showing <span className="font-semibold text-[#16191f]">{zones.length > 0 ? (page - 1) * limit + 1 : 0}</span> to{' '}
            <span className="font-semibold text-[#16191f]">{Math.min(page * limit, total)}</span> of{' '}
            <span className="font-semibold text-[#16191f]">{total}</span> hosted zones
          </div>

          <div className="flex items-center space-x-4">
            {/* Rows per page selector */}
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

            {/* Pagination Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => {
                  const nextP = page - 1;
                  setPage(nextP);
                  loadZones(nextP, search, limit);
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
                  loadZones(nextP, search, limit);
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

      {/* Modals */}
      <CreateHostedZoneModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateZone}
      />

      <CreateHostedZoneModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditZone}
        editZone={selectedZone}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete hosted zone"
        message={`Are you sure you want to delete the hosted zone "${selectedZone?.name}" (${selectedZone?.zone_id})? This will permanently delete the hosted zone and all ${selectedZone?.record_count || 0} associated DNS records.`}
        resourceName={selectedZone?.name}
        requireTypingConfirm={true}
        confirmButtonText="Delete hosted zone"
        isDestructive={true}
        isLoading={deleteLoading}
        onConfirm={handleDeleteZone}
        onCancel={() => setIsDeleteOpen(false)}
      />
    </div>
  );
};
