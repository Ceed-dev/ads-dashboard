"use client";

import { useState, use, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Archive } from "lucide-react";
import type { AdDTO, AdFormat, AutocompleteType, DisplayPosition, FollowupTapAction } from "@/types/ad";
import type { AdvertiserDTO } from "@/types/advertiser";
import { useTranslation } from "@/contexts/LanguageContext";
import PageHeader from "@/components/admin/PageHeader";

async function fetchAd(id: string): Promise<AdDTO> {
  const res = await fetch(`/api/admin/ads/${id}`);
  if (!res.ok) throw new Error("Failed to load ad");
  return res.json();
}

async function fetchAdvertisers(): Promise<AdvertiserDTO[]> {
  const res = await fetch("/api/admin/advertisers");
  if (!res.ok) throw new Error("Failed to load advertisers");
  const data = await res.json();
  return data.items || [];
}

async function updateAd(id: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/admin/ads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update ad");
  }
  return res.json();
}

async function duplicateAd(id: string): Promise<{ id: string }> {
  const res = await fetch(`/api/admin/ads/${id}/duplicate`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to duplicate ad");
  }
  return res.json();
}

const inputClass = "w-full px-3 py-2 border border-white/[0.12] rounded-md bg-[#141414] text-[#e5e5e5] focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed";
const labelClass = "block text-sm font-medium text-[#e5e5e5] mb-1";
const sectionClass = "mt-6 p-4 border border-white/[0.12] rounded-lg bg-[#1a1a1a]";

export default function AdDetailPage({
  params,
}: {
  params: Promise<{ adId: string }>;
}) {
  const { t } = useTranslation();
  const { adId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [format, setFormat] = useState<AdFormat>("action_card");

  // Lead gen state
  const [autocompleteType, setAutocompleteType] = useState<AutocompleteType>("email");

  // Static state
  const [displayPosition, setDisplayPosition] = useState<DisplayPosition>("top");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [geoRegions, setGeoRegions] = useState<string[]>([]);
  const [geoInput, setGeoInput] = useState("");
  const [deviceTypes, setDeviceTypes] = useState<("desktop" | "mobile" | "tablet")[]>([]);

  // Followup state
  const [tapAction, setTapAction] = useState<FollowupTapAction>("expand");

  const { data: ad, isLoading: adLoading } = useQuery<AdDTO>({
    queryKey: ["ads", adId],
    queryFn: () => fetchAd(adId),
  });

  const { data: advertisers = [] } = useQuery<AdvertiserDTO[]>({
    queryKey: ["advertisers"],
    queryFn: fetchAdvertisers,
  });

  // Initialize state from ad data
  useEffect(() => {
    if (ad) {
      setTags(ad.tags || []);
      setFormat(ad.format || "action_card");

      // Lead gen
      if (ad.leadGenConfig) {
        setAutocompleteType(ad.leadGenConfig.autocompleteType || "email");
      }

      // Static
      if (ad.staticConfig) {
        setDisplayPosition(ad.staticConfig.displayPosition || "top");
        setKeywords(ad.staticConfig.targetingParams?.keywords || []);
        setGeoRegions(ad.staticConfig.targetingParams?.geo || []);
        setDeviceTypes(ad.staticConfig.targetingParams?.deviceTypes || []);
      }

      // Followup
      if (ad.followupConfig) {
        setTapAction(ad.followupConfig.tapAction || "expand");
      }
    }
  }, [ad]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateAd(adId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : t("errors.unknownError"));
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: () => duplicateAd(adId),
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      router.push(`/admin/ads/${id}`);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : t("errors.unknownError"));
    },
  });

  const addTag = () => {
    const tag = tagInput.toLowerCase().trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const addKeyword = () => {
    const kw = keywordInput.toLowerCase().trim();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setKeywordInput("");
    }
  };

  const removeKeyword = (kw: string) => setKeywords(keywords.filter((k) => k !== kw));

  const addGeoRegion = () => {
    const geo = geoInput.trim();
    if (geo && !geoRegions.includes(geo)) {
      setGeoRegions([...geoRegions, geo]);
      setGeoInput("");
    }
  };

  const removeGeoRegion = (geo: string) => setGeoRegions(geoRegions.filter((g) => g !== geo));

  const toggleDeviceType = (device: "desktop" | "mobile" | "tablet") => {
    if (deviceTypes.includes(device)) {
      setDeviceTypes(deviceTypes.filter((d) => d !== device));
    } else {
      setDeviceTypes([...deviceTypes, device]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, unknown> = {
      advertiserId: formData.get("advertiserId") as string,
      format,
      title: { eng: formData.get("titleEng") as string, jpn: formData.get("titleJpn") as string || undefined },
      description: { eng: formData.get("descEng") as string, jpn: formData.get("descJpn") as string || undefined },
      ctaText: { eng: formData.get("ctaEng") as string, jpn: formData.get("ctaJpn") as string || undefined },
      ctaUrl: formData.get("ctaUrl") as string,
      tags,
      status: formData.get("status") as string,
    };

    // Add format-specific config
    if (format === "lead_gen") {
      data.leadGenConfig = {
        placeholder: {
          eng: formData.get("leadGenPlaceholderEng") as string,
          jpn: formData.get("leadGenPlaceholderJpn") as string || undefined,
        },
        submitButtonText: {
          eng: formData.get("leadGenSubmitEng") as string,
          jpn: formData.get("leadGenSubmitJpn") as string || undefined,
        },
        autocompleteType,
        successMessage: {
          eng: formData.get("leadGenSuccessEng") as string,
          jpn: formData.get("leadGenSuccessJpn") as string || undefined,
        },
      };
    } else if (format === "static") {
      data.staticConfig = {
        displayPosition,
        targetingParams: {
          keywords: keywords.length > 0 ? keywords : undefined,
          geo: geoRegions.length > 0 ? geoRegions : undefined,
          deviceTypes: deviceTypes.length > 0 ? deviceTypes : undefined,
        },
      };
    } else if (format === "followup") {
      data.followupConfig = {
        questionText: {
          eng: formData.get("followupQuestionEng") as string,
          jpn: formData.get("followupQuestionJpn") as string || undefined,
        },
        tapAction,
        tapActionUrl: tapAction === "redirect" ? formData.get("followupTapActionUrl") as string : undefined,
      };
    }

    updateMutation.mutate(data);
  };

  const handleDuplicate = () => {
    duplicateMutation.mutate();
  };

  const handleArchive = () => {
    if (!confirm(t("ads.confirmArchive"))) return;
    updateMutation.mutate({ status: "archived" });
  };

  if (adLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <PageHeader title={t("ads.editAd")} />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="flex flex-col min-h-screen">
        <PageHeader title={t("ads.editAd")} />
        <div className="flex-1 flex items-center justify-center text-red-400">
          {t("ads.notFound")}
        </div>
      </div>
    );
  }

  const isArchived = ad.status === "archived";

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title={t("ads.editAd")}>
        <button
          onClick={handleDuplicate}
          disabled={duplicateMutation.isPending}
          className="inline-flex items-center px-4 py-2 border border-white/[0.12] text-white rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <Copy className="w-4 h-4 mr-2" />
          {t("common.duplicate")}
        </button>
        {!isArchived && (
          <button
            onClick={handleArchive}
            disabled={updateMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-red-700 text-red-400 rounded-md hover:bg-red-900/30 transition-colors disabled:opacity-50"
          >
            <Archive className="w-4 h-4 mr-2" />
            {t("common.archive")}
          </button>
        )}
      </PageHeader>

      <div className="flex-1 p-6">
        <Link
          href="/admin/ads"
          className="inline-flex items-center text-gray-400 hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("ads.backToList")}
        </Link>

        <div className="text-sm text-gray-400 mb-4">
          {t("common.id")}: {ad.id}
        </div>

        {isArchived && (
          <div className="mb-4 p-4 bg-yellow-900/30 border border-yellow-800 text-yellow-300 rounded-lg">
            {t("ads.archivedWarning")}
          </div>
        )}

        <form onSubmit={handleSubmit} key={ad.id} className="bg-[#141414] border border-white/[0.12] rounded-lg p-6 max-w-[460px]">
          {error && (
            <div className="mb-4 p-4 bg-red-900/30 border border-red-800 text-red-300 rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className={labelClass}>{t("ads.advertiser")} *</label>
            <select name="advertiserId" required disabled={isArchived} defaultValue={ad.advertiserId} className={inputClass}>
              <option value="">{t("common.select")}</option>
              {advertisers.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="mb-4">
            <label className={labelClass}>{t("ads.format")} *</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as AdFormat)}
              disabled={isArchived}
              className={inputClass}
            >
              <option value="action_card">{t("ads.formats.action_card")}</option>
              <option value="lead_gen">{t("ads.formats.lead_gen")}</option>
              <option value="static">{t("ads.formats.static")}</option>
              <option value="followup">{t("ads.formats.followup")}</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>{t("ads.titleEn")} *</label>
              <input name="titleEng" required disabled={isArchived} defaultValue={ad.title.eng} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t("ads.titleJp")}</label>
              <input name="titleJpn" disabled={isArchived} defaultValue={ad.title.jpn || ""} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>{t("ads.descriptionEn")} *</label>
              <textarea name="descEng" required disabled={isArchived} rows={3} defaultValue={ad.description.eng} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t("ads.descriptionJp")}</label>
              <textarea name="descJpn" disabled={isArchived} rows={3} defaultValue={ad.description.jpn || ""} className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className={labelClass}>{t("ads.ctaTextEn")} *</label>
              <input name="ctaEng" required disabled={isArchived} defaultValue={ad.ctaText.eng} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t("ads.ctaTextJp")}</label>
              <input name="ctaJpn" disabled={isArchived} defaultValue={ad.ctaText.jpn || ""} className={inputClass} />
            </div>
          </div>

          <div className="mb-4">
            <label className={labelClass}>{t("ads.ctaUrl")} *</label>
            <input name="ctaUrl" type="url" required disabled={isArchived} defaultValue={ad.ctaUrl} placeholder={t("placeholders.httpsUrl")} className={inputClass} />
          </div>

          <div className="mb-4">
            <label className={labelClass}>{t("ads.tags")} *</label>
            {!isArchived && (
              <div className="flex gap-2 mb-2">
                <input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder={t("ads.addTag")}
                  className={`flex-1 ${inputClass}`}
                />
                <button type="button" onClick={addTag} className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors">
                  {t("common.add")}
                </button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center px-2.5 py-0.5 bg-gray-700 rounded-full text-sm text-white">
                  {tag}
                  {!isArchived && (
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-gray-400 hover:text-white">×</button>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Lead Gen Config */}
          {format === "lead_gen" && (
            <div className={sectionClass}>
              <h3 className="text-[#e5e5e5] font-medium mb-4">{t("ads.leadGen.title")}</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelClass}>{t("ads.leadGen.placeholderEn")} *</label>
                  <input
                    name="leadGenPlaceholderEng"
                    required
                    disabled={isArchived}
                    defaultValue={ad.leadGenConfig?.placeholder?.eng || ""}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("ads.leadGen.placeholderJp")}</label>
                  <input
                    name="leadGenPlaceholderJpn"
                    disabled={isArchived}
                    defaultValue={ad.leadGenConfig?.placeholder?.jpn || ""}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelClass}>{t("ads.leadGen.submitButtonEn")} *</label>
                  <input
                    name="leadGenSubmitEng"
                    required
                    disabled={isArchived}
                    defaultValue={ad.leadGenConfig?.submitButtonText?.eng || ""}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("ads.leadGen.submitButtonJp")}</label>
                  <input
                    name="leadGenSubmitJpn"
                    disabled={isArchived}
                    defaultValue={ad.leadGenConfig?.submitButtonText?.jpn || ""}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className={labelClass}>{t("ads.leadGen.autocompleteType")} *</label>
                <select
                  value={autocompleteType}
                  onChange={(e) => setAutocompleteType(e.target.value as AutocompleteType)}
                  disabled={isArchived}
                  className={inputClass}
                >
                  <option value="email">{t("ads.autocompleteTypes.email")}</option>
                  <option value="name">{t("ads.autocompleteTypes.name")}</option>
                  <option value="tel">{t("ads.autocompleteTypes.tel")}</option>
                  <option value="off">{t("ads.autocompleteTypes.off")}</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{t("ads.leadGen.successMessageEn")} *</label>
                  <input
                    name="leadGenSuccessEng"
                    required
                    disabled={isArchived}
                    defaultValue={ad.leadGenConfig?.successMessage?.eng || ""}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("ads.leadGen.successMessageJp")}</label>
                  <input
                    name="leadGenSuccessJpn"
                    disabled={isArchived}
                    defaultValue={ad.leadGenConfig?.successMessage?.jpn || ""}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Static Config */}
          {format === "static" && (
            <div className={sectionClass}>
              <h3 className="text-[#e5e5e5] font-medium mb-4">{t("ads.static.title")}</h3>

              <div className="mb-4">
                <label className={labelClass}>{t("ads.static.displayPosition")} *</label>
                <select
                  value={displayPosition}
                  onChange={(e) => setDisplayPosition(e.target.value as DisplayPosition)}
                  disabled={isArchived}
                  className={inputClass}
                >
                  <option value="top">{t("ads.static.positions.top")}</option>
                  <option value="bottom">{t("ads.static.positions.bottom")}</option>
                  <option value="inline">{t("ads.static.positions.inline")}</option>
                  <option value="sidebar">{t("ads.static.positions.sidebar")}</option>
                </select>
              </div>

              <div className="mb-4">
                <label className={labelClass}>{t("ads.static.keywords")}</label>
                {!isArchived && (
                  <div className="flex gap-2 mb-2">
                    <input
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                      placeholder={t("ads.static.addKeyword")}
                      className={`flex-1 ${inputClass}`}
                    />
                    <button type="button" onClick={addKeyword} className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors">
                      {t("common.add")}
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {keywords.map((kw) => (
                    <span key={kw} className="inline-flex items-center px-2.5 py-0.5 bg-gray-700 rounded-full text-sm text-white">
                      {kw}
                      {!isArchived && (
                        <button type="button" onClick={() => removeKeyword(kw)} className="ml-1 text-gray-400 hover:text-white">×</button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className={labelClass}>{t("ads.static.geo")}</label>
                {!isArchived && (
                  <div className="flex gap-2 mb-2">
                    <input
                      value={geoInput}
                      onChange={(e) => setGeoInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGeoRegion())}
                      placeholder={t("ads.static.addGeo")}
                      className={`flex-1 ${inputClass}`}
                    />
                    <button type="button" onClick={addGeoRegion} className="px-4 py-2 bg-gray-700 text-white rounded-md hover:bg-gray-600 transition-colors">
                      {t("common.add")}
                    </button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {geoRegions.map((geo) => (
                    <span key={geo} className="inline-flex items-center px-2.5 py-0.5 bg-gray-700 rounded-full text-sm text-white">
                      {geo}
                      {!isArchived && (
                        <button type="button" onClick={() => removeGeoRegion(geo)} className="ml-1 text-gray-400 hover:text-white">×</button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("ads.static.deviceTypes")}</label>
                <div className="flex gap-4">
                  {(["desktop", "mobile", "tablet"] as const).map((device) => (
                    <label key={device} className="flex items-center gap-2 text-[#e5e5e5] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={deviceTypes.includes(device)}
                        onChange={() => !isArchived && toggleDeviceType(device)}
                        disabled={isArchived}
                        className="w-4 h-4 rounded border-white/[0.12] bg-[#141414] text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                      />
                      {t(`ads.static.devices.${device}`)}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Followup Config */}
          {format === "followup" && (
            <div className={sectionClass}>
              <h3 className="text-[#e5e5e5] font-medium mb-4">{t("ads.followup.title")}</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className={labelClass}>{t("ads.followup.questionTextEn")} *</label>
                  <textarea
                    name="followupQuestionEng"
                    required
                    disabled={isArchived}
                    rows={2}
                    defaultValue={ad.followupConfig?.questionText?.eng || ""}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("ads.followup.questionTextJp")}</label>
                  <textarea
                    name="followupQuestionJpn"
                    disabled={isArchived}
                    rows={2}
                    defaultValue={ad.followupConfig?.questionText?.jpn || ""}
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className={labelClass}>{t("ads.followup.tapAction")} *</label>
                <select
                  value={tapAction}
                  onChange={(e) => setTapAction(e.target.value as FollowupTapAction)}
                  disabled={isArchived}
                  className={inputClass}
                >
                  <option value="expand">{t("ads.followup.tapActions.expand")}</option>
                  <option value="redirect">{t("ads.followup.tapActions.redirect")}</option>
                  <option value="submit">{t("ads.followup.tapActions.submit")}</option>
                </select>
              </div>

              {tapAction === "redirect" && (
                <div>
                  <label className={labelClass}>{t("ads.followup.tapActionUrl")} *</label>
                  <input
                    name="followupTapActionUrl"
                    type="url"
                    required
                    disabled={isArchived}
                    defaultValue={ad.followupConfig?.tapActionUrl || ""}
                    placeholder={t("placeholders.httpsUrl")}
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          )}

          <div className="mb-6 mt-6">
            <label className={labelClass}>{t("common.status")}</label>
            <select name="status" disabled={isArchived} defaultValue={ad.status} className={inputClass}>
              <option value="paused">{t("status.paused")}</option>
              <option value="active">{t("status.active")}</option>
              {isArchived && <option value="archived">{t("status.archived")}</option>}
            </select>
          </div>

          {!isArchived && (
            <button type="submit" disabled={updateMutation.isPending} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {updateMutation.isPending ? t("common.saving") : t("common.saveChanges")}
            </button>
          )}

          <div className="mt-6 pt-6 border-t border-white/[0.12] text-sm text-gray-400">
            <p>{t("common.created")}: {new Date(ad.meta.createdAt).toLocaleString()} {t("common.by")} {ad.meta.createdBy}</p>
            <p>{t("common.updated")}: {new Date(ad.meta.updatedAt).toLocaleString()} {t("common.by")} {ad.meta.updatedBy}</p>
          </div>
        </form>
      </div>
    </div>
  );
}
