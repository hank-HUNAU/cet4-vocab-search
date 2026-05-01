"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import {
  type Category,
  type BlankAnnotation,
  type KnowledgePoint,
  type ExamSet,
  type CET4Data,
} from "@/data/cet4-data";
import {
  getAllBlanks,
  getSubCategories,
  getSubCategoryDistribution,
  getWordPartOfSpeechDistribution,
  searchFullText,
  getWordAssociations,
  getRelatedWords,
  getAllWords,
} from "@/lib/cet4-utils";
import { useDataContext, type DatasetItem } from "@/context/DataContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  BookOpen,
  Search,
  BarChart3,
  FileText,
  Link2,
  GraduationCap,
  Hash,
  TrendingUp,
  Sparkles,
  Tag,
  Layers,
  Eye,
  EyeOff,
  Database,
  Upload,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Rocket,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

// ─── Chart Configs ───────────────────────────────────────────────

const grammarChartConfig: ChartConfig = {
  count: { label: "出现次数", color: "#14b8a6" },
};

const semanticChartConfig: ChartConfig = {
  count: { label: "出现次数", color: "#f59e0b" },
};

const posChartConfig: ChartConfig = {
  value: { label: "数量" },
  动词: { label: "动词", color: "#14b8a6" },
  名词: { label: "名词", color: "#f59e0b" },
  形容词: { label: "形容词", color: "#8b5cf6" },
  副词: { label: "副词", color: "#ec4899" },
  动名词: { label: "动名词", color: "#06b6d4" },
  分词: { label: "分词", color: "#f97316" },
};

const POS_COLORS: Record<string, string> = {
  动词: "#14b8a6",
  名词: "#f59e0b",
  形容词: "#8b5cf6",
  副词: "#ec4899",
  动名词: "#06b6d4",
  分词: "#f97316",
};

// ─── Utility Components ──────────────────────────────────────────

function KpBadge({ kp }: { kp: KnowledgePoint }) {
  const isGrammar = kp.category === "语法";
  return (
    <Badge
      variant="outline"
      className={`text-xs font-normal ${
        isGrammar
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
          : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-300"
      }`}
    >
      <span className="mr-1 opacity-70">{isGrammar ? "📝" : "💡"}</span>
      {kp.sub_category}
    </Badge>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: number }) {
  const colors: Record<number, string> = {
    1: "bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700",
    2: "bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-700",
    3: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-700",
    4: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700",
    5: "bg-red-100 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700",
  };
  const labels = ["", "简单", "较易", "中等", "较难", "困难"];
  return (
    <Badge variant="outline" className={`text-xs ${colors[difficulty] || ""}`}>
      ★ {labels[difficulty]}
    </Badge>
  );
}

function FrequencyBadge({ frequency }: { frequency: string }) {
  const colors: Record<string, string> = {
    高频: "bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-700",
    中频: "bg-sky-100 text-sky-700 border-sky-300 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-700",
    低频: "bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-600",
  };
  return (
    <Badge variant="outline" className={`text-xs ${colors[frequency] || ""}`}>
      {frequency}
    </Badge>
  );
}

function HighlightedText({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  if (!query.trim()) return <>{text}</>;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: Array<{ text: string; highlighted: boolean }> = [];
  let lastIndex = 0;

  let idx = lowerText.indexOf(lowerQuery);
  while (idx !== -1) {
    if (idx > lastIndex) {
      parts.push({ text: text.slice(lastIndex, idx), highlighted: false });
    }
    parts.push({
      text: text.slice(idx, idx + query.length),
      highlighted: true,
    });
    lastIndex = idx + query.length;
    idx = lowerText.indexOf(lowerQuery, lastIndex);
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlighted: false });
  }

  return (
    <>
      {parts.map((part, i) =>
        part.highlighted ? (
          <mark
            key={i}
            className="bg-yellow-200 text-yellow-900 dark:bg-yellow-800 dark:text-yellow-100 rounded px-0.5"
          >
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </>
  );
}

function BlankInline({
  blankId,
  correctWord,
  revealed,
  onToggle,
}: {
  blankId: number;
  correctWord: string;
  revealed: boolean;
  onToggle: () => void;
}) {
  return (
    <span
      className="inline-flex items-center cursor-pointer group relative mx-0.5"
      onClick={onToggle}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onToggle();
      }}
    >
      {revealed ? (
        <span className="border-b-2 border-teal-500 text-teal-700 dark:text-teal-300 font-semibold bg-teal-50 dark:bg-teal-950/50 px-1 rounded transition-all">
          {correctWord}
        </span>
      ) : (
        <span className="border-b-2 border-muted-foreground/40 text-muted-foreground/60 px-2 hover:border-teal-400 hover:text-teal-600 transition-all">
          ___({blankId})___
        </span>
      )}
    </span>
  );
}

// ─── Statistics Overview Tab ──────────────────────────────────────

function StatisticsTab({ data }: { data: CET4Data }) {
  const allBlanks = useMemo(() => getAllBlanks(data), [data]);
  const grammarDist = useMemo(() => getSubCategoryDistribution(data, "语法"), [data]);
  const semanticDist = useMemo(() => getSubCategoryDistribution(data, "语义"), [data]);
  const posDist = useMemo(() => getWordPartOfSpeechDistribution(data), [data]);

  const totalBlanks = allBlanks.length;
  const totalKps = allBlanks.reduce(
    (acc, b) => acc + b.annotations.knowledge_points.length,
    0
  );
  const grammarKps = allBlanks.reduce(
    (acc, b) =>
      acc +
      b.annotations.knowledge_points.filter((kp) => kp.category === "语法")
        .length,
    0
  );
  const semanticKps = totalKps - grammarKps;

  const summaryCards = [
    {
      title: "总空格数",
      value: totalBlanks,
      icon: <Hash className="h-4 w-4" />,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/50",
    },
    {
      title: "总知识点数",
      value: totalKps,
      icon: <Sparkles className="h-4 w-4" />,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/50",
    },
    {
      title: "语法知识点",
      value: grammarKps,
      icon: <BookOpen className="h-4 w-4" />,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
    },
    {
      title: "语义知识点",
      value: semanticKps,
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950/50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="py-4">
            <CardContent className="flex items-center gap-3">
              <div
                className={`p-2 sm:p-2.5 rounded-lg ${card.bg} ${card.color}`}
              >
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className={`text-xl sm:text-2xl font-bold ${card.color}`}>
                  {card.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Grammar Sub-category Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">语法子类分布</CardTitle>
            <CardDescription>各语法知识点子类出现频次</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={grammarChartConfig} className="h-[220px] sm:h-[300px] w-full">
              <BarChart
                data={grammarDist.slice(0, 10)}
                layout="vertical"
                margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Semantic Sub-category Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">语义子类分布</CardTitle>
            <CardDescription>各语义知识点子类出现频次</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={semanticChartConfig} className="h-[220px] sm:h-[300px] w-full">
              <BarChart
                data={semanticDist.slice(0, 10)}
                layout="vertical"
                margin={{ left: 10, right: 10, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={80}
                  tick={{ fontSize: 12 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar
                  dataKey="count"
                  fill="var(--color-count)"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* POS Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">词性分布</CardTitle>
          <CardDescription>答案词汇的词性分布统计</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row items-center gap-6">
            <ChartContainer config={posChartConfig} className="h-[220px] sm:h-[280px] w-full max-w-[400px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={posDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  labelLine={{ stroke: "var(--color-border)" }}
                >
                  {posDist.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={POS_COLORS[entry.name] || "#94a3b8"}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <div className="flex flex-wrap gap-3 justify-center">
              {posDist.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: POS_COLORS[item.name] || "#94a3b8" }}
                  />
                  <span className="text-sm">
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">题目套数概览</CardTitle>
          <CardDescription>{(data.sets ?? []).length}套题目的基本信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>套题</TableHead>
                <TableHead>主题</TableHead>
                <TableHead>题目类型</TableHead>
                <TableHead>空格范围</TableHead>
                <TableHead>答案序列</TableHead>
                <TableHead>平均难度</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data.sets ?? []).map((set) => {
                const blanks = (set.passage?.segments ?? []).filter(
                  (s) => s.type === "blank"
                );
                const blankIds = blanks.map((s) =>
                  s.type === "blank" ? s.id : 0
                );
                const answers = blanks.map((s) =>
                  s.type === "blank" ? s.annotations.correct_answer : ""
                );
                const avgDifficulty =
                  blanks.length > 0
                    ? (
                        blanks.reduce((acc, s) => {
                          if (s.type === "blank")
                            return acc + s.annotations.difficulty;
                          return acc;
                        }, 0) / blanks.length
                      ).toFixed(1)
                    : "—";
                return (
                  <TableRow key={set.set_id}>
                    <TableCell className="font-medium">
                      第 {set.set_id} 套
                    </TableCell>
                    <TableCell>{set.theme}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        词汇匹配
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {blankIds.length > 0
                        ? `${Math.min(...blankIds)}-${Math.max(...blankIds)}`
                        : "—"}{" "}
                      ({blankIds.length}空)
                    </TableCell>
                    <TableCell className="font-mono text-xs tracking-wider">
                      {answers.join(" → ")}
                    </TableCell>
                    <TableCell>
                      <DifficultyBadge difficulty={Math.round(Number(avgDifficulty))} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Knowledge Point Search Tab ──────────────────────────────────

function KnowledgePointSearchTab({ data }: { data: CET4Data }) {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>("all");

  const allBlanks = useMemo(() => getAllBlanks(data), [data]);

  const subCategories = useMemo(() => {
    const cat = categoryFilter === "all" ? undefined : (categoryFilter as Category);
    return getSubCategories(data, cat);
  }, [data, categoryFilter]);

  const filtered = useMemo(() => {
    return allBlanks.filter((b) => {
      const matchesCategory =
        categoryFilter === "all" ||
        b.annotations.knowledge_points.some(
          (kp) => kp.category === categoryFilter
        );
      const matchesSubCategory =
        subCategoryFilter === "all" ||
        b.annotations.knowledge_points.some(
          (kp) => kp.sub_category === subCategoryFilter
        );
      return matchesCategory && matchesSubCategory;
    });
  }, [allBlanks, categoryFilter, subCategoryFilter]);

  const handleCategoryChange = useCallback((val: string) => {
    setCategoryFilter(val);
    setSubCategoryFilter("all");
  }, []);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 items-start sm:items-center pt-6">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">分类筛选</span>
          </div>
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="语法">语法</SelectItem>
              <SelectItem value="语义">语义</SelectItem>
            </SelectContent>
          </Select>
          <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="选择子类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部子类</SelectItem>
              {subCategories.map((sc) => (
                <SelectItem key={sc} value={sc}>
                  {sc}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="secondary" className="text-xs">
            共 {filtered.length} 条结果
          </Badge>
        </CardContent>
      </Card>

      {/* Results */}
      <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-320px)]">
        <div className="space-y-3 pr-4">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
                <p>未找到匹配的知识点</p>
                <p className="text-xs mt-1">请尝试调整筛选条件</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((b) => (
              <Card key={`${b.setId}-${b.blankId}`} className="py-3 hover:shadow-md transition-shadow">
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="font-mono text-xs border-teal-400 text-teal-600 dark:border-teal-600 dark:text-teal-400"
                      >
                        第{b.setId}套
                      </Badge>
                      <Badge
                        variant="outline"
                        className="font-mono text-xs border-amber-400 text-amber-600 dark:border-amber-600 dark:text-amber-400"
                      >
                        空{b.blankId}
                      </Badge>
                      <DifficultyBadge difficulty={b.annotations.difficulty} />
                      <FrequencyBadge frequency={b.annotations.frequency} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-teal-600 hover:bg-teal-700 text-white text-xs">
                        {b.annotations.correct_answer}. {b.annotations.correct_word}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded p-2">
                    {b.context}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {b.annotations.knowledge_points.map((kp, i) => (
                      <KpBadge key={i} kp={kp} />
                    ))}
                  </div>
                  {b.annotations.knowledge_points.map((kp, i) => (
                    <p key={i} className="text-xs text-muted-foreground pl-2 border-l-2 border-muted">
                      <span className="font-medium">{kp.sub_category}</span>
                      ：{kp.description}
                    </p>
                  ))}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ─── Question Search Tab ─────────────────────────────────────────

function QuestionSearchTab({ data }: { data: CET4Data }) {
  const [setFilter, setSetFilter] = useState<string>("all");
  const [blankRangeStart, setBlankRangeStart] = useState<string>("");
  const [blankRangeEnd, setBlankRangeEnd] = useState<string>("");
  const [revealedBlanks, setRevealedBlanks] = useState<Set<string>>(new Set());

  const toggleReveal = useCallback((key: string) => {
    setRevealedBlanks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const filteredSets = useMemo(() => {
    let sets = data.sets ?? [];
    if (setFilter !== "all") {
      sets = sets.filter((s) => s.set_id === Number(setFilter));
    }
    return sets;
  }, [data, setFilter]);

  const getBlanksForSet = useCallback(
    (set: ExamSet) => {
      const blanks = (set.passage?.segments ?? []).filter(
        (s) => s.type === "blank"
      ) as Array<{
        type: "blank";
        id: number;
        position: string;
        annotations: BlankAnnotation;
      }>;
      if (!blankRangeStart && !blankRangeEnd) return blanks;
      return blanks.filter((b) => {
        const start = blankRangeStart ? Number(blankRangeStart) : -Infinity;
        const end = blankRangeEnd ? Number(blankRangeEnd) : Infinity;
        return b.id >= start && b.id <= end;
      });
    },
    [blankRangeStart, blankRangeEnd]
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 items-start sm:items-center pt-6">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">套题筛选</span>
          </div>
          <Select value={setFilter} onValueChange={setSetFilter}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="选择套题" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              {(data.sets ?? []).map((s) => (
                <SelectItem key={s.set_id} value={String(s.set_id)}>
                  第{s.set_id}套
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">空格ID范围</span>
            <Input
              type="number"
              placeholder="起始"
              value={blankRangeStart}
              onChange={(e) => setBlankRangeStart(e.target.value)}
              className="w-[70px] sm:w-[80px] h-8 text-sm"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="number"
              placeholder="结束"
              value={blankRangeEnd}
              onChange={(e) => setBlankRangeEnd(e.target.value)}
              className="w-[70px] sm:w-[80px] h-8 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Accordion per set */}
      <Accordion type="multiple" defaultValue={(filteredSets ?? []).map((s) => `set-${s.set_id}`)}>
        {(filteredSets ?? []).map((set) => {
          const blanks = getBlanksForSet(set);
          return (
            <AccordionItem key={set.set_id} value={`set-${set.set_id}`}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3">
                  <Badge className="bg-teal-600 text-white">第{set.set_id}套</Badge>
                  <span className="font-medium">{set.theme}</span>
                  <Badge variant="secondary" className="text-xs">
                    {blanks.length} 个空格
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {/* Word Bank */}
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-muted-foreground flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" /> 词库
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {(set.word_bank ?? []).map((wb) => {
                        const isUsed = blanks.some(
                          (b) => b.annotations.correct_answer === wb.letter
                        );
                        return (
                          <Badge
                            key={wb.letter}
                            variant={isUsed ? "default" : "outline"}
                            className={
                              isUsed
                                ? "bg-teal-600 text-white text-xs"
                                : "text-xs opacity-50"
                            }
                          >
                            {wb.letter}. {wb.word}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Full passage with blanks */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" /> 文章（点击空格显示答案）
                      </h4>
                      <button
                        className="text-xs text-teal-600 hover:text-teal-700 flex items-center gap-1 ml-auto"
                        onClick={() => {
                          const allKeys = (set.passage?.segments ?? [])
                            .filter((s) => s.type === "blank")
                            .map((s) => `${set.set_id}-${s.type === "blank" ? s.id : ""}`);
                          setRevealedBlanks((prev) => {
                            const allRevealed = allKeys.every((k) => prev.has(k));
                            const next = new Set(prev);
                            if (allRevealed) {
                              allKeys.forEach((k) => next.delete(k));
                            } else {
                              allKeys.forEach((k) => next.add(k));
                            }
                            return next;
                          });
                        }}
                      >
                        {(set.passage?.segments ?? []).filter((s) => s.type === "blank").every((s) => revealedBlanks.has(`${set.set_id}-${s.id}`)) ? (
                          <><EyeOff className="h-3.5 w-3.5" /> 全部隐藏</>
                        ) : (
                          <><Eye className="h-3.5 w-3.5" /> 全部显示</>
                        )}
                      </button>
                    </div>
                    <div className="text-sm leading-relaxed bg-muted/30 rounded-lg p-4 whitespace-pre-wrap">
                      {(set.passage?.segments ?? []).map((seg, i) => {
                        if (seg.type === "text") {
                          return <span key={i}>{seg.content}</span>;
                        }
                        const key = `${set.set_id}-${seg.id}`;
                        const isRevealed = revealedBlanks.has(key);
                        return (
                          <BlankInline
                            key={i}
                            blankId={seg.id}
                            correctWord={seg.annotations.correct_word}
                            revealed={isRevealed}
                            onToggle={() => toggleReveal(key)}
                          />
                        );
                      })}
                    </div>
                  </div>

                  <Separator />

                  {/* Blank details */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" /> 空格详情
                    </h4>
                    <div className="space-y-3">
                      {blanks.map((b) => (
                        <Card key={b.id} className="py-2">
                          <CardContent className="space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="font-mono text-xs border-amber-400 text-amber-600 dark:border-amber-600 dark:text-amber-400"
                                >
                                  空{b.id}
                                </Badge>
                                <Badge className="bg-teal-600 text-white text-xs">
                                  {b.annotations.correct_answer}.{" "}
                                  {b.annotations.correct_word}
                                </Badge>
                                <DifficultyBadge difficulty={b.annotations.difficulty} />
                                <FrequencyBadge frequency={b.annotations.frequency} />
                              </div>
                            </div>
                            <Accordion type="single" collapsible>
                              <AccordionItem value={`kp-${b.id}`} className="border-none">
                                <AccordionTrigger className="py-1 text-xs text-muted-foreground hover:no-underline">
                                  知识点详情 ({b.annotations.knowledge_points.length})
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-2 pl-2">
                                    {b.annotations.knowledge_points.map((kp, i) => (
                                      <div key={i} className="space-y-1">
                                        <KpBadge kp={kp} />
                                        <p className="text-xs text-muted-foreground">
                                          {kp.description}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}

// ─── Full Text Search Tab ────────────────────────────────────────

function FullTextSearchTab({ data }: { data: CET4Data }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchFullText(data, query);
  }, [data, query]);

  // Group by setId
  const groupedResults = useMemo(() => {
    const groups: Record<number, typeof results> = {};
    for (const r of results) {
      if (!groups[r.setId]) groups[r.setId] = [];
      groups[r.setId].push(r);
    }
    return groups;
  }, [results]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索文章内容（支持中英文）..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-10"
            />
          </div>
          {query.trim() && (
            <p className="text-sm text-muted-foreground mt-2">
              找到 {results.length} 处匹配
            </p>
          )}
        </CardContent>
      </Card>

      {!query.trim() ? (
        <Card>
          <CardContent className="py-10 sm:py-16 text-center text-muted-foreground">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">全文搜索</p>
            <p className="text-sm mt-1">
              输入关键词搜索文章内容，支持中英文搜索
            </p>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {["resources", "community", "education", "obesity", "teachers"].map(
                (hint) => (
                  <Badge
                    key={hint}
                    variant="outline"
                    className="cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors"
                    onClick={() => setQuery(hint)}
                  >
                    {hint}
                  </Badge>
                )
              )}
            </div>
          </CardContent>
        </Card>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
            <p>未找到匹配的内容</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[calc(100vh-300px)]">
          <div className="space-y-4 pr-4">
            {Object.entries(groupedResults).map(([setId, items]) => {
              const set = (data.sets ?? []).find((s) => s.set_id === Number(setId));
              return (
                <Card key={setId}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge className="bg-teal-600 text-white">第{setId}套</Badge>
                      {set?.theme}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {items.map((item, i) => (
                      <div
                        key={i}
                        className="text-sm bg-muted/30 rounded p-2.5 leading-relaxed"
                      >
                        {item.blankId !== null && (
                          <Badge
                            variant="outline"
                            className="text-xs mr-2 border-amber-400 text-amber-600 dark:border-amber-600 dark:text-amber-400"
                          >
                            空{item.blankId}
                          </Badge>
                        )}
                        <HighlightedText text={item.content} query={query} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}

// ─── Word Association Tab ────────────────────────────────────────

function WordAssociationTab({ data }: { data: CET4Data }) {
  const [selectedWord, setSelectedWord] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");

  const allWords = useMemo(() => getAllWords(data), [data]);

  const filteredWords = useMemo(() => {
    if (!searchInput.trim()) return allWords.slice(0, 30);
    const lower = searchInput.toLowerCase();
    return allWords.filter((w) =>
      w.word.toLowerCase().includes(lower)
    );
  }, [allWords, searchInput]);

  const associations = useMemo(() => {
    if (!selectedWord) return [];
    return getWordAssociations(data, selectedWord);
  }, [data, selectedWord]);

  const relatedWords = useMemo(() => {
    if (!selectedWord) return [];
    return getRelatedWords(data, selectedWord);
  }, [data, selectedWord]);

  // Gather all knowledge points for the selected word
  const allKpsForWord = useMemo(() => {
    const kps: KnowledgePoint[] = [];
    for (const assoc of associations) {
      for (const kp of assoc.annotations.knowledge_points) {
        if (!kps.find((k) => k.sub_category === kp.sub_category && k.category === kp.category)) {
          kps.push(kp);
        }
      }
    }
    return kps;
  }, [associations]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="输入或搜索单词..."
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setSelectedWord(e.target.value);
                }}
                className="pl-9 h-10"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 sm:max-h-32 overflow-y-auto">
              {filteredWords.map((w) => (
                <Badge
                  key={`${w.word}-${w.setId}`}
                  variant={selectedWord.toLowerCase() === w.word.toLowerCase() ? "default" : "outline"}
                  className={`cursor-pointer text-xs transition-colors ${
                    selectedWord.toLowerCase() === w.word.toLowerCase()
                      ? "bg-teal-600 text-white hover:bg-teal-700"
                      : "hover:bg-teal-50 dark:hover:bg-teal-950"
                  }`}
                  onClick={() => {
                    setSelectedWord(w.word);
                    setSearchInput(w.word);
                  }}
                >
                  {w.letter}. {w.word}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedWord ? (
        <Card>
          <CardContent className="py-10 sm:py-16 text-center text-muted-foreground">
            <Link2 className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">单词关联</p>
            <p className="text-sm mt-1">
              选择一个单词，查看其作为答案的题目、知识点及关联词
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Word Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <span className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                  {selectedWord}
                </span>
                <Badge className="bg-teal-600 text-white">
                  {associations.length} 处出现
                </Badge>
              </CardTitle>
              <CardDescription>该单词作为正确答案出现的位置</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {associations.map((assoc, i) => (
                  <div
                    key={i}
                    className="bg-muted/30 rounded-lg p-3 space-y-2"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className="bg-teal-600 text-white text-xs">
                        第{assoc.setId}套
                      </Badge>
                      <Badge
                        variant="outline"
                        className="text-xs border-amber-400 text-amber-600 dark:border-amber-600 dark:text-amber-400"
                      >
                        空{assoc.blankId}
                      </Badge>
                      <Badge className="bg-teal-700 text-white text-xs">
                        {assoc.annotations.correct_answer}. {assoc.annotations.correct_word}
                      </Badge>
                      <DifficultyBadge difficulty={assoc.annotations.difficulty} />
                      <FrequencyBadge frequency={assoc.annotations.frequency} />
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {assoc.annotations.knowledge_points.map((kp, j) => (
                        <KpBadge key={j} kp={kp} />
                      ))}
                    </div>
                    {assoc.annotations.knowledge_points.map((kp, j) => (
                      <p
                        key={j}
                        className="text-xs text-muted-foreground pl-2 border-l-2 border-muted"
                      >
                        <span className="font-medium">{kp.sub_category}</span>
                        ：{kp.description}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* All Knowledge Points for this word */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                关联知识点
              </CardTitle>
              <CardDescription>该单词涉及的所有知识点</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {allKpsForWord.map((kp, i) => (
                  <div key={i} className="flex flex-col gap-1 bg-muted/30 rounded p-2">
                    <KpBadge kp={kp} />
                    <p className="text-xs text-muted-foreground">{kp.description}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Related Words */}
          {relatedWords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-teal-500" />
                  关联词汇
                </CardTitle>
                <CardDescription>
                  与该单词共享知识点的其他答案词
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {relatedWords.map((word) => (
                    <Badge
                      key={word}
                      variant="outline"
                      className="cursor-pointer hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors text-sm"
                      onClick={() => {
                        setSelectedWord(word);
                        setSearchInput(word);
                      }}
                    >
                      {word}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Data Upload Tab ─────────────────────────────────────────────

/** Represents a file item in the pending upload list */
interface PendingFile {
  id: string;
  file: File;
  /** Relative path within a folder (or just the filename) */
  relativePath: string;
  /** Folder name if from folder upload */
  folderName: string | null;
  /** Whether the user has checked this file for upload */
  checked: boolean;
  /** Preview text (first 2000 chars of formatted JSON) */
  preview: string | null;
  /** Whether JSON parsing succeeded */
  valid: boolean;
  /** Error message if invalid */
  error: string | null;
}

function DataUploadTab() {
  const {
    datasets,
    isLoading: ctxLoading,
    uploadAndLoad,
    deleteDataset,
    refreshDatasets,
    selectedDatasetIds,
    toggleDataset,
    hasGitHubToken,
    setGitHubToken,
    clearGitHubToken,
  } = useDataContext();

  const [uploading, setUploading] = useState(false);
  const [tokenInput, setTokenInput] = useState("");
  const [validating, setValidating] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
    currentFile: string;
  } | null>(null);
  const [uploadResults, setUploadResults] = useState<
    { fileName: string; success: boolean; message: string }[]
  >([]);
  const [dragActive, setDragActive] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [loading, setLoading] = useState(false);
  // Ref for hidden file input (single/multi file)
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Ref for hidden folder input
  const folderInputRef = useRef<HTMLInputElement>(null);

  const fetchDatasets = useCallback(async () => {
    setLoading(true);
    try {
      await refreshDatasets();
    } finally {
      setLoading(false);
    }
  }, [refreshDatasets]);

  // ── Parse a single file into a PendingFile ───────────────────────
  const parseFile = useCallback(
    async (file: File, relativePath: string, folderName: string | null): Promise<PendingFile> => {
      const id = `${file.name}-${file.size}-${file.lastModified}`;
      const isJson = file.name.endsWith(".json") || file.type === "application/json";
      if (!isJson) {
        return { id, file, relativePath, folderName, checked: false, preview: null, valid: false, error: "非JSON文件" };
      }
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const preview = JSON.stringify(parsed, null, 2).slice(0, 2000);
        return { id, file, relativePath, folderName, checked: true, preview, valid: true, error: null };
      } catch {
        return { id, file, relativePath, folderName, checked: false, preview: "JSON解析失败", valid: false, error: "JSON格式无效" };
      }
    },
    []
  );

  // ── Handle single/multi file selection ────────────────────────────
  const handleFileInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const newFiles: PendingFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const pf = await parseFile(file, file.name, null);
        newFiles.push(pf);
      }
      setPendingFiles((prev) => {
        // Deduplicate by id
        const existing = new Set(prev.map((p) => p.id));
        return [...prev, ...newFiles.filter((nf) => !existing.has(nf.id))];
      });
      // Reset input value so the same file(s) can be re-selected
      e.target.value = "";
    },
    [parseFile]
  );

  // ── Handle folder selection ───────────────────────────────────────
  const handleFolderInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const newFiles: PendingFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // webkitRelativePath looks like "FolderName/sub/file.json" or "FolderName/file.json"
        const relativePath = file.webkitRelativePath || file.name;
        const parts = relativePath.split("/");
        const folderName = parts.length > 1 ? parts[0] : null;
        const pf = await parseFile(file, relativePath, folderName);
        newFiles.push(pf);
      }
      setPendingFiles((prev) => {
        const existing = new Set(prev.map((p) => p.id));
        return [...prev, ...newFiles.filter((nf) => !existing.has(nf.id))];
      });
      e.target.value = "";
    },
    [parseFile]
  );

  // ── Handle drag-and-drop ──────────────────────────────────────────
  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const items = e.dataTransfer.items;
      const newFiles: PendingFile[] = [];
      if (items) {
        for (let i = 0; i < items.length; i++) {
          const entry = items[i].webkitGetAsEntry?.();
          if (entry) {
            const entries = await traverseEntry(entry);
            for (const { file, path, folder } of entries) {
              const pf = await parseFile(file, path, folder);
              newFiles.push(pf);
            }
          } else {
            // Fallback: just use the file
            const file = items[i].getAsFile();
            if (file) {
              const pf = await parseFile(file, file.name, null);
              newFiles.push(pf);
            }
          }
        }
      } else {
        // Fallback: use files
        for (let i = 0; i < e.dataTransfer.files.length; i++) {
          const file = e.dataTransfer.files[i];
          const pf = await parseFile(file, file.name, null);
          newFiles.push(pf);
        }
      }
      setPendingFiles((prev) => {
        const existing = new Set(prev.map((p) => p.id));
        return [...prev, ...newFiles.filter((nf) => !existing.has(nf.id))];
      });
    },
    [parseFile]
  );

  // ── Traverse a DataTransfer entry (file or directory) ────────────
  const traverseEntry = useCallback(
    (entry: FileSystemEntry): Promise<{ file: File; path: string; folder: string | null }[]> => {
      return new Promise((resolve) => {
        if (entry.isFile) {
          (entry as FileSystemFileEntry).file((file) => {
            const path = entry.fullPath.replace(/^\//, "") || file.name;
            const parts = path.split("/");
            const folder = parts.length > 1 ? parts[0] : null;
            resolve([{ file, path, folder }]);
          });
        } else if (entry.isDirectory) {
          const dirReader = (entry as FileSystemDirectoryEntry).createReader();
          const allEntries: { file: File; path: string; folder: string | null }[] = [];
          const readBatch = () => {
            dirReader.readEntries(async (entries) => {
              if (entries.length === 0) {
                resolve(allEntries);
                return;
              }
              for (const child of entries) {
                const childResults = await traverseEntry(child);
                allEntries.push(...childResults);
              }
              readBatch(); // readEntries may not return all entries in one call
            });
          };
          readBatch();
        } else {
          resolve([]);
        }
      });
    },
    []
  );

  // ── Toggle a pending file's checked state ─────────────────────────
  const togglePendingFile = useCallback((id: string) => {
    setPendingFiles((prev) =>
      prev.map((pf) => (pf.id === id ? { ...pf, checked: !pf.checked } : pf))
    );
  }, []);

  // ── Select / deselect all pending files (only valid ones) ────────
  const toggleSelectAllPending = useCallback(
    (checked: boolean) => {
      setPendingFiles((prev) =>
        prev.map((pf) => (pf.valid ? { ...pf, checked } : pf))
      );
    },
    []
  );

  // ── Remove a pending file from the list ───────────────────────────
  const removePendingFile = useCallback((id: string) => {
    setPendingFiles((prev) => prev.filter((pf) => pf.id !== id));
  }, []);

  // ── Clear all pending files ───────────────────────────────────────
  const clearPendingFiles = useCallback(() => {
    setPendingFiles([]);
  }, []);

  // ── Batch upload all checked pending files ────────────────────────
  const handleBatchUpload = useCallback(async () => {
    const filesToUpload = pendingFiles.filter((pf) => pf.checked && pf.valid);
    if (filesToUpload.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: filesToUpload.length, currentFile: "" });
    setUploadResults([]);
    const results: { fileName: string; success: boolean; message: string }[] = [];

    for (let i = 0; i < filesToUpload.length; i++) {
      const pf = filesToUpload[i];
      setUploadProgress({ current: i + 1, total: filesToUpload.length, currentFile: pf.file.name });
      try {
        // Auto-generate name from file name (strip .json)
        const autoName = pf.file.name.replace(/\.json$/i, "");
        await uploadAndLoad(pf.file, autoName, undefined, pf.folderName || undefined);
        results.push({ fileName: pf.file.name, success: true, message: "上传成功" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "上传失败";
        results.push({ fileName: pf.file.name, success: false, message: msg });
      }
    }

    setUploadResults(results);
    setUploadProgress(null);
    setUploading(false);

    // Remove successfully uploaded files from pending list
    const successIds = new Set(
      filesToUpload
        .filter((_, idx) => results[idx]?.success)
        .map((pf) => pf.id)
    );
    setPendingFiles((prev) => prev.filter((pf) => !successIds.has(pf.id)));

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;
    if (failCount === 0) {
      toast.success("全部上传成功", { description: `成功上传 ${successCount} 个文件` });
    } else {
      toast.warning("部分上传失败", { description: `成功 ${successCount}，失败 ${failCount}` });
    }
  }, [pendingFiles, uploadAndLoad]);

  // ── Set GitHub Token ────────────────────────────────────────────
  const handleSetToken = useCallback(async () => {
    if (!tokenInput.trim()) return;
    setValidating(true);
    try {
      const valid = await setGitHubToken(tokenInput.trim());
      if (valid) {
        toast.success("Token 验证成功");
        setTokenInput("");
      } else {
        toast.error("Token 验证失败", { description: "请检查 Token 是否正确，以及是否有 repo 权限" });
      }
    } catch {
      toast.error("Token 验证请求失败");
    } finally {
      setValidating(false);
    }
  }, [tokenInput, setGitHubToken]);

  // ── Delete an uploaded dataset ────────────────────────────────────
  const handleDelete = useCallback(
    async (id: string, name: string) => {
      if (!hasGitHubToken) {
        toast.error("请先配置 GitHub Token");
        return;
      }
      if (!confirm(`确定删除数据集"${name}"？此操作将删除GitHub仓库中的数据文件并触发重新部署。`)) return;
      try {
        await deleteDataset(id);
        toast.success("删除成功", { description: `数据集"${name}"已从GitHub仓库删除，页面将在部署完成后自动更新` });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "删除失败";
        toast.error("删除失败", { description: msg });
      }
    },
    [deleteDataset, hasGitHubToken]
  );

  // ── Export a dataset as JSON ──────────────────────────────────────
  const handleExport = useCallback(async (id: string, name: string) => {
    try {
      const basePath = window.location.pathname.startsWith("/cet4-vocab-search") ? "/cet4-vocab-search" : "";
      const res = await fetch(`${basePath}/data/datasets/${id}.json`);
      if (res.ok) {
        const record = await res.json();
        const dataStr = JSON.stringify(record.data, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${name}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch {
      console.error("Export failed");
    }
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ── Computed values ───────────────────────────────────────────────
  const validPendingFiles = pendingFiles.filter((pf) => pf.valid);
  const checkedCount = validPendingFiles.filter((pf) => pf.checked).length;
  const allValidChecked = validPendingFiles.length > 0 && validPendingFiles.every((pf) => pf.checked);

  // Group pending files by folder
  const folderGroups = useMemo(() => {
    const groups = new Map<string, PendingFile[]>();
    for (const pf of pendingFiles) {
      const key = pf.folderName || "__no_folder__";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(pf);
    }
    return groups;
  }, [pendingFiles]);

  return (
    <div className="space-y-6">
      {/* GitHub Token Configuration */}
      <Card className={hasGitHubToken ? "border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-950/30 dark:to-emerald-950/30" : "border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-950/30 dark:to-orange-950/30"}>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-lg text-white ${hasGitHubToken ? "bg-gradient-to-br from-green-600 to-emerald-600" : "bg-gradient-to-br from-amber-600 to-orange-600"}`}>
                <Rocket className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  {hasGitHubToken ? "GitHub 管理已连接" : "配置 GitHub Personal Access Token"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {hasGitHubToken
                    ? "已配置Token，可以通过GitHub API管理仓库中的数据文件，上传和删除操作将自动触发GitHub Actions重新部署"
                    : "需要配置GitHub PAT才能上传和删除数据，Token需要有repo权限，数据变更将自动触发GitHub Pages重新部署"}
                </p>
              </div>
            </div>
            {hasGitHubToken && (
              <Button
                onClick={() => { clearGitHubToken(); toast.info("Token 已清除"); }}
                variant="outline"
                size="sm"
                className="shrink-0"
              >
                清除Token
              </Button>
            )}
          </div>
          {!hasGitHubToken && (
            <div className="mt-4 flex gap-2">
              <Input
                type="password"
                placeholder="输入 GitHub Personal Access Token (需要 repo 权限)"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSetToken(); }}
                className="flex-1"
              />
              <Button
                onClick={handleSetToken}
                disabled={validating || !tokenInput.trim()}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shrink-0"
              >
                {validating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
                {validating ? "验证中..." : "验证并保存"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4 text-teal-600" />
            JSON文件上传
          </CardTitle>
          <CardDescription>
            上传CET4标注数据JSON文件，支持选择文件、多文件、文件夹上传
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag & Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              dragActive
                ? "border-teal-400 bg-teal-50 dark:bg-teal-950/30"
                : "border-muted-foreground/25 hover:border-teal-300 hover:bg-teal-50/50 dark:hover:bg-teal-950/20"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <Upload
              className={`h-10 w-10 mx-auto mb-3 ${
                dragActive ? "text-teal-500" : "text-muted-foreground/40"
              }`}
            />
            <p className="text-sm font-medium">
              拖拽JSON文件或文件夹到此处
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              支持 .json 格式，可拖入文件夹自动扫描
            </p>
          </div>

          {/* Action buttons row */}
          <div className="flex flex-wrap gap-3">
            {/* Hidden file input for single/multi file selection */}
            <input
              type="file"
              accept=".json"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileInputChange}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-sm transition-colors"
            >
              <FileJson className="h-4 w-4" />
              选择文件
            </button>

            {/* Hidden folder input */}
            <input
              type="file"
              className="hidden"
              ref={folderInputRef}
              onChange={handleFolderInputChange}
              // @ts-expect-error webkitdirectory is non-standard but widely supported
              webkitdirectory=""
              directory=""
              multiple
            />
            <button
              onClick={() => folderInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2.5 border-2 border-teal-600 text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-950/30 rounded-lg font-medium text-sm transition-colors"
            >
              <Layers className="h-4 w-4" />
              选择文件夹
            </button>

            {pendingFiles.length > 0 && (
              <button
                onClick={clearPendingFiles}
                className="flex items-center gap-2 px-4 py-2.5 border border-muted-foreground/30 text-muted-foreground hover:bg-muted/30 rounded-lg font-medium text-sm transition-colors ml-auto"
              >
                <Trash2 className="h-4 w-4" />
                清空列表
              </button>
            )}
          </div>

          {/* Pending Files List with checkboxes */}
          {pendingFiles.length > 0 && (
            <div className="space-y-3">
              {/* Select All Bar */}
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="select-all-pending"
                    checked={allValidChecked}
                    onCheckedChange={(checked) => toggleSelectAllPending(!!checked)}
                  />
                  <label htmlFor="select-all-pending" className="text-sm font-medium cursor-pointer">
                    全选 ({checkedCount}/{validPendingFiles.length} 个有效文件)
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    共 {pendingFiles.length} 个文件
                    {pendingFiles.filter((pf) => !pf.valid).length > 0 && (
                      <span className="text-amber-600 ml-1">
                        ({pendingFiles.filter((pf) => !pf.valid).length} 个无效)
                      </span>
                    )}
                  </span>
                  <button
                    onClick={handleBatchUpload}
                    disabled={uploading || checkedCount === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        上传中 ({uploadProgress?.current}/{uploadProgress?.total})...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        上传选中 ({checkedCount})
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Upload progress */}
              {uploadProgress && (
                <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-lg border border-teal-200 dark:border-teal-800">
                  <div className="flex items-center gap-2 text-sm text-teal-700 dark:text-teal-300">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>
                      正在上传: {uploadProgress.currentFile} ({uploadProgress.current}/{uploadProgress.total})
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-teal-100 dark:bg-teal-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-600 rounded-full transition-all duration-300"
                      style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Upload results */}
              {uploadResults.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {uploadResults.map((r, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 p-2 rounded text-xs ${
                        r.success
                          ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300"
                          : "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300"
                      }`}
                    >
                      {r.success ? (
                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                      )}
                      <span className="font-medium">{r.fileName}</span>
                      <span>{r.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* File list grouped by folder */}
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {Array.from(folderGroups.entries()).map(([folderKey, files]) => (
                  <div key={folderKey} className="border rounded-lg overflow-hidden">
                    {/* Folder header */}
                    {folderKey !== "__no_folder__" && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b">
                        <Layers className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium">{folderKey}</span>
                        <Badge variant="secondary" className="text-xs">
                          {files.filter((f) => f.valid).length}/{files.length} 有效
                        </Badge>
                        <div className="ml-auto">
                          <Checkbox
                            checked={files.filter((f) => f.valid).length > 0 && files.filter((f) => f.valid).every((f) => f.checked)}
                            onCheckedChange={(checked) => {
                              setPendingFiles((prev) =>
                                prev.map((pf) => {
                                  if (pf.folderName === folderKey && pf.valid) {
                                    return { ...pf, checked: !!checked };
                                  }
                                  return pf;
                                })
                              );
                            }}
                          />
                        </div>
                      </div>
                    )}
                    {/* File items */}
                    <div className="divide-y">
                      {files.map((pf) => (
                        <div
                          key={pf.id}
                          className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${
                            pf.valid
                              ? pf.checked
                                ? "bg-teal-50/50 dark:bg-teal-950/20"
                                : "hover:bg-muted/20"
                              : "bg-red-50/30 dark:bg-red-950/10 opacity-60"
                          }`}
                        >
                          <Checkbox
                            checked={pf.checked}
                            disabled={!pf.valid}
                            onCheckedChange={() => togglePendingFile(pf.id)}
                          />
                          <FileJson className={`h-5 w-5 flex-shrink-0 ${pf.valid ? "text-teal-600" : "text-red-400"}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">
                                {folderKey === "__no_folder__" ? pf.file.name : pf.relativePath.split("/").slice(1).join("/") || pf.file.name}
                              </span>
                              {pf.valid ? (
                                <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 text-[10px] px-1.5 py-0">
                                  有效
                                </Badge>
                              ) : (
                                <Badge className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 text-[10px] px-1.5 py-0">
                                  无效
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{formatFileSize(pf.file.size)}</span>
                              {pf.error && <span className="text-red-500">{pf.error}</span>}
                            </div>
                          </div>
                          <button
                            onClick={() => removePendingFile(pf.id)}
                            className="p-1 hover:bg-muted rounded transition-colors"
                          >
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Preview for single selected file */}
              {validPendingFiles.length === 1 && validPendingFiles[0].preview && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">
                    数据预览: {validPendingFiles[0].file.name}
                  </label>
                  <ScrollArea className="h-40 rounded-lg border bg-muted/30 p-3">
                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                      {validPendingFiles[0].preview}
                      {validPendingFiles[0].preview!.length >= 2000 && "\n... (已截断)"}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dataset List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4 text-teal-600" />
                已上传数据集
              </CardTitle>
              <CardDescription>管理已上传的JSON数据文件</CardDescription>
            </div>
            <button
              onClick={fetchDatasets}
              className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
              />
              刷新
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {(ctxLoading || loading) && datasets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <RefreshCw className="h-6 w-6 mx-auto mb-2 animate-spin" />
              <p className="text-sm">加载中...</p>
            </div>
          ) : datasets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Database className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">暂无数据集</p>
              <p className="text-xs mt-1">上传JSON文件后，数据集将显示在此处</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Select All in upload tab */}
              <div className="flex items-center gap-2 pb-2 border-b">
                <Checkbox
                  id="select-all-upload"
                  checked={datasets.length > 0 && datasets.every((ds) => selectedDatasetIds.has(ds.id))}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      datasets.forEach((ds) => {
                        if (!selectedDatasetIds.has(ds.id)) toggleDataset(ds.id);
                      });
                    } else {
                      datasets.forEach((ds) => {
                        if (selectedDatasetIds.has(ds.id)) toggleDataset(ds.id);
                      });
                    }
                  }}
                />
                <label htmlFor="select-all-upload" className="text-sm font-medium cursor-pointer">
                  全选 ({selectedDatasetIds.size}/{datasets.length})
                </label>
              </div>
              {datasets.map((ds: DatasetItem) => (
                <div
                  key={ds.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/30 transition-colors ${
                    selectedDatasetIds.has(ds.id)
                      ? "border-teal-400 bg-teal-50/50 dark:bg-teal-950/20"
                      : ""
                  }`}
                >
                  <Checkbox
                    checked={selectedDatasetIds.has(ds.id)}
                    onCheckedChange={() => toggleDataset(ds.id)}
                  />
                  <FileJson className="h-8 w-8 text-teal-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium">{ds.name}</p>
                      {selectedDatasetIds.has(ds.id) && (
                        <Badge className="bg-teal-600 text-white text-xs">已选中</Badge>
                      )}
                      {ds.examYear && ds.examMonth && (
                        <Badge variant="secondary" className="text-xs">
                          {ds.examYear}年{ds.examMonth}月
                        </Badge>
                      )}
                      {ds.totalSets != null && (
                        <Badge variant="secondary" className="text-xs">
                          {ds.totalSets}套题
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{ds.fileName}</span>
                      <span>{formatFileSize(ds.fileSize)}</span>
                      <span>
                        {new Date(ds.createdAt).toLocaleString("zh-CN")}
                      </span>
                    </div>
                    {ds.description && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {ds.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleExport(ds.id, ds.name)}
                      className="p-1.5 hover:bg-teal-50 dark:hover:bg-teal-950 rounded transition-colors"
                      title="导出JSON"
                    >
                      <Download className="h-4 w-4 text-teal-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(ds.id, ds.name)}
                      className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950 rounded transition-colors"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GitHub API Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-teal-600" />
            数据管理说明
          </CardTitle>
          <CardDescription>基于GitHub Contents API的数据管理机制</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Badge className="bg-teal-600 text-white text-xs mt-0.5 shrink-0">数据存储</Badge>
              <span>所有数据集以JSON文件形式存储在GitHub仓库的 <code className="text-xs font-mono bg-muted px-1 rounded">public/data/datasets/</code> 目录中，索引文件为 <code className="text-xs font-mono bg-muted px-1 rounded">public/data/index.json</code></span>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="bg-amber-600 text-white text-xs mt-0.5 shrink-0">上传机制</Badge>
              <span>上传文件时，通过GitHub Contents API将数据写入仓库，自动触发GitHub Actions构建和部署GitHub Pages静态站点</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="bg-red-600 text-white text-xs mt-0.5 shrink-0">删除机制</Badge>
              <span>删除数据集时，通过GitHub Contents API从仓库中删除对应文件并更新索引，同样自动触发重新部署</span>
            </div>
            <div className="flex items-start gap-2">
              <Badge className="bg-purple-600 text-white text-xs mt-0.5 shrink-0">权限要求</Badge>
              <span>GitHub Personal Access Token需要有 <code className="text-xs font-mono bg-muted px-1 rounded">repo</code> 权限才能读写仓库文件。Token仅存储在浏览器localStorage中，不会发送到任何第三方服务器</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Data Source Selector (above tabs) ─────────────────────────────

function DataSourceSelector() {
  const {
    data,
    datasets,
    selectedDatasetIds,
    isAllSelected,
    isLoading,
    error,
    toggleDataset,
    selectAll,
    deselectAll,
  } = useDataContext();

  const hasSelectedData = selectedDatasetIds.size > 0;
  const [isExpanded, setIsExpanded] = useState(!hasSelectedData);

  const totalBlanks = useMemo(() => {
    let count = 0;
    for (const set of data.sets ?? []) {
      for (const seg of set.passage?.segments ?? []) {
        if (seg.type === "blank") count++;
      }
    }
    return count;
  }, [data]);

  const selectedCount = selectedDatasetIds.size;
  const totalCount = datasets.length;

  return (
    <Card className="mb-4 border-teal-200 dark:border-teal-800">
      <CardContent className="pt-4 sm:pt-6 pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Left: data source info */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-teal-600" />
              <span className="text-sm font-medium">数据源：</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs border-teal-400 text-teal-600 dark:border-teal-600 dark:text-teal-400">
                已选择 {selectedCount}/{totalCount} 个数据集
              </Badge>
              <Badge variant="secondary" className="text-xs">
                📋 {data.sets?.length ?? 0}套题
              </Badge>
              <Badge variant="secondary" className="text-xs">
                📝 {totalBlanks}空
              </Badge>
            </div>
          </div>

          {/* Right: expand */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/50 transition-colors"
            >
              {isExpanded ? (
                <><ChevronUp className="h-3.5 w-3.5" /> 收起</>
              ) : (
                <><ChevronDown className="h-3.5 w-3.5" /> 选择数据集</>
              )}
            </button>
          </div>
        </div>

        {/* Expanded: dataset checkboxes + error */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t space-y-3">
            {/* Select All / Deselect All */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={isAllSelected}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      selectAll();
                    } else {
                      deselectAll();
                    }
                  }}
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  全选
                </label>
              </div>
              <span className="text-xs text-muted-foreground">
                已选择 {selectedCount}/{totalCount} 个数据集
              </span>
            </div>

            {/* Dataset list with checkboxes */}
            {datasets.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                <Database className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">暂无数据集，请先上传数据</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {datasets.map((ds) => (
                  <div
                    key={ds.id}
                    className={`flex items-center gap-3 p-2.5 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer ${
                      selectedDatasetIds.has(ds.id)
                        ? "border-teal-400 bg-teal-50/50 dark:bg-teal-950/20"
                        : ""
                    }`}
                    onClick={() => toggleDataset(ds.id)}
                  >
                    <Checkbox
                      id={`ds-${ds.id}`}
                      checked={selectedDatasetIds.has(ds.id)}
                      onCheckedChange={() => toggleDataset(ds.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <label htmlFor={`ds-${ds.id}`} className="text-sm font-medium cursor-pointer">
                          {ds.name}
                        </label>
                        {ds.examYear && ds.examMonth && (
                          <Badge variant="secondary" className="text-xs">
                            {ds.examYear}年{ds.examMonth}月
                          </Badge>
                        )}
                        {ds.totalSets != null && (
                          <Badge variant="secondary" className="text-xs">
                            {ds.totalSets}套题
                          </Badge>
                        )}
                      </div>
                      {ds.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {ds.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-2 rounded bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300 text-xs">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                {error}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function HomePage() {
  const { data, selectedDatasetIds, datasets } = useDataContext();
  const [activeTab, setActiveTab] = useState("upload");
  const [questionType, setQuestionType] = useState("banked_cloze");

  const selectedQt = data.question_types?.find((qt) => qt.id === questionType);
  // Show data if there are sets available
  const hasData = data.sets && data.sets.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      {/* Header */}
      <header className="border-b bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 dark:from-purple-950/30 dark:via-pink-950/30 dark:to-amber-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-600 to-pink-600 text-white">
                <Database className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-foreground">
                  CET4 管理后台
                </h1>
                <p className="text-sm text-muted-foreground">
                  管理数据集 · 发布到 GitHub Pages
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href="https://hank-hunau.github.io/cet4-vocab-search/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  className="gap-1.5 border-purple-300 text-purple-700 hover:bg-purple-50 dark:border-purple-600 dark:text-purple-300 dark:hover:bg-purple-950/50"
                >
                  <ExternalLink className="h-4 w-4" />
                  查看公开站点
                </Button>
              </a>
              <Badge
                variant="outline"
                className="text-xs border-purple-400 text-purple-600 dark:border-purple-600 dark:text-purple-400"
              >
                {selectedDatasetIds.size > 0 ? `${selectedDatasetIds.size}个数据集` : "未选择"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-6 w-full">
        {/* Data Source Selector */}
        <DataSourceSelector />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-6">
            <TabsList className="w-full flex flex-nowrap overflow-x-auto h-auto gap-1 bg-muted/50 p-1.5 rounded-xl">
              <TabsTrigger
                value="upload"
                className="flex-1 min-w-0 sm:min-w-[120px] data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <Database className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline ml-1.5">数据管理</span>
              </TabsTrigger>
              <TabsTrigger
                value="statistics"
                className="flex-1 min-w-0 sm:min-w-[120px] data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <BarChart3 className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline ml-1.5">数据统计</span>
              </TabsTrigger>
              <TabsTrigger
                value="fulltext"
                className="flex-1 min-w-0 sm:min-w-[120px] data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <BookOpen className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline ml-1.5">全文检索</span>
              </TabsTrigger>
              <TabsTrigger
                value="knowledge"
                className="flex-1 min-w-0 sm:min-w-[120px] data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <Search className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline ml-1.5">知识点检索</span>
              </TabsTrigger>
              <TabsTrigger
                value="word"
                className="flex-1 min-w-0 sm:min-w-[120px] data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <Link2 className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline ml-1.5">单词检索</span>
              </TabsTrigger>
              <TabsTrigger
                value="question"
                className="flex-1 min-w-0 sm:min-w-[120px] data-[state=active]:bg-purple-600 data-[state=active]:text-white"
              >
                <FileText className="h-4 w-4 sm:mr-1.5" />
                <span className="hidden sm:inline ml-1.5">套题浏览</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Tab 1: 数据管理 */}
          <TabsContent value="upload">
            <DataUploadTab />
          </TabsContent>

          {/* Tab 2-6: Analysis tabs (only show data when available) */}
          {!hasData ? (
            <TabsContent value="statistics" forceMount className="hidden">
              <StatisticsTab data={data} />
            </TabsContent>
          ) : (
            <>
              <TabsContent value="statistics">
                <StatisticsTab data={data} />
              </TabsContent>
              <TabsContent value="fulltext">
                <FullTextSearchTab data={data} />
              </TabsContent>
              <TabsContent value="knowledge">
                <KnowledgePointSearchTab data={data} />
              </TabsContent>
              <TabsContent value="word">
                <WordAssociationTab data={data} />
              </TabsContent>
              <TabsContent value="question">
                <QuestionSearchTab data={data} />
              </TabsContent>
            </>
          )}

          {/* No-data prompt - always visible in analysis tabs when no data */}
          {!hasData && activeTab !== "upload" && (
            <Card className="py-10 sm:py-16">
              <CardContent className="text-center space-y-4">
                <Database className="h-16 w-16 mx-auto text-purple-300" />
                <h2 className="text-xl font-semibold text-foreground">{selectedQt?.label}</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  {selectedQt?.description}
                </p>
                <p className="text-sm text-purple-600 bg-purple-50 dark:bg-purple-950/50 rounded-lg px-4 py-2 inline-block">
                  {datasets.length === 0
                    ? "请先上传数据集以开始分析"
                    : "请在上方勾选数据集以查看数据"}
                </p>
                <div>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="mt-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium text-sm flex items-center gap-2 mx-auto transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    前往数据管理
                  </button>
                </div>
              </CardContent>
            </Card>
          )}
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 text-center text-sm text-muted-foreground">
          {selectedDatasetIds.size > 0 ? (
            <>数据来源：已选数据集 · 标注版本：v{data.metadata.annotation_version || "2.0"} · 套题数：{(data.sets ?? []).length}</>
          ) : (
            <>数据来源：未选择数据集 · 请上传并勾选数据集以开始分析</>
          )}
        </div>
      </footer>
    </div>
  );
}
