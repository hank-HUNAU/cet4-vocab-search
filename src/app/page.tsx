"use client";

import { useState, useMemo, useCallback } from "react";
import {
  cet4Data,
  getAllBlanks,
  getSubCategories,
  getSubCategoryDistribution,
  getWordPartOfSpeechDistribution,
  searchFullText,
  getWordAssociations,
  getRelatedWords,
  getAllWords,
  type Category,
  type BlankAnnotation,
  type KnowledgePoint,
  type ExamSet,
} from "@/data/cet4-data";
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
  ResponsiveContainer,
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
} from "lucide-react";

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

function StatisticsTab() {
  const allBlanks = useMemo(() => getAllBlanks(), []);
  const grammarDist = useMemo(() => getSubCategoryDistribution("语法"), []);
  const semanticDist = useMemo(() => getSubCategoryDistribution("语义"), []);
  const posDist = useMemo(() => getWordPartOfSpeechDistribution(), []);

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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="py-4">
            <CardContent className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-lg ${card.bg} ${card.color}`}
              >
                {card.icon}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className={`text-2xl font-bold ${card.color}`}>
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
            <ChartContainer config={grammarChartConfig} className="h-[300px] w-full">
              <BarChart
                data={grammarDist.slice(0, 10)}
                layout="vertical"
                margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
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
            <ChartContainer config={semanticChartConfig} className="h-[300px] w-full">
              <BarChart
                data={semanticDist.slice(0, 10)}
                layout="vertical"
                margin={{ left: 20, right: 20, top: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
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
            <ChartContainer config={posChartConfig} className="h-[280px] w-full max-w-[400px]">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Pie
                  data={posDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
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
          <CardDescription>3套题目的基本信息</CardDescription>
        </CardHeader>
        <CardContent>
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
              {cet4Data.sets.map((set) => {
                const blanks = set.passage.segments.filter(
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
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Knowledge Point Search Tab ──────────────────────────────────

function KnowledgePointSearchTab() {
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [subCategoryFilter, setSubCategoryFilter] = useState<string>("all");

  const allBlanks = useMemo(() => getAllBlanks(), []);

  const subCategories = useMemo(() => {
    const cat = categoryFilter === "all" ? undefined : (categoryFilter as Category);
    return getSubCategories(cat);
  }, [categoryFilter]);

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
        <CardContent className="flex flex-wrap gap-4 items-center pt-6">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">分类筛选</span>
          </div>
          <Select value={categoryFilter} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="选择分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="语法">语法</SelectItem>
              <SelectItem value="语义">语义</SelectItem>
            </SelectContent>
          </Select>
          <Select value={subCategoryFilter} onValueChange={setSubCategoryFilter}>
            <SelectTrigger className="w-[180px]">
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
      <ScrollArea className="h-[calc(100vh-320px)]">
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

function QuestionSearchTab() {
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
    let sets = cet4Data.sets;
    if (setFilter !== "all") {
      sets = sets.filter((s) => s.set_id === Number(setFilter));
    }
    return sets;
  }, [setFilter]);

  const getBlanksForSet = useCallback(
    (set: ExamSet) => {
      const blanks = set.passage.segments.filter(
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
        <CardContent className="flex flex-wrap gap-4 items-center pt-6">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">套题筛选</span>
          </div>
          <Select value={setFilter} onValueChange={setSetFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="选择套题" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="1">第1套</SelectItem>
              <SelectItem value="2">第2套</SelectItem>
              <SelectItem value="3">第3套</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">空格ID范围</span>
            <Input
              type="number"
              placeholder="起始"
              value={blankRangeStart}
              onChange={(e) => setBlankRangeStart(e.target.value)}
              className="w-[80px] h-8 text-sm"
            />
            <span className="text-muted-foreground">—</span>
            <Input
              type="number"
              placeholder="结束"
              value={blankRangeEnd}
              onChange={(e) => setBlankRangeEnd(e.target.value)}
              className="w-[80px] h-8 text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Accordion per set */}
      <Accordion type="multiple" defaultValue={filteredSets.map((s) => `set-${s.set_id}`)}>
        {filteredSets.map((set) => {
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
                      {set.word_bank.map((wb) => {
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
                          const allKeys = set.passage.segments
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
                        {set.passage.segments.filter((s) => s.type === "blank").every((s) => revealedBlanks.has(`${set.set_id}-${s.id}`)) ? (
                          <><EyeOff className="h-3.5 w-3.5" /> 全部隐藏</>
                        ) : (
                          <><Eye className="h-3.5 w-3.5" /> 全部显示</>
                        )}
                      </button>
                    </div>
                    <div className="text-sm leading-relaxed bg-muted/30 rounded-lg p-4 whitespace-pre-wrap">
                      {set.passage.segments.map((seg, i) => {
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

function FullTextSearchTab() {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchFullText(query);
  }, [query]);

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
          <CardContent className="py-16 text-center text-muted-foreground">
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
              const set = cet4Data.sets.find((s) => s.set_id === Number(setId));
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

function WordAssociationTab() {
  const [selectedWord, setSelectedWord] = useState<string>("");
  const [searchInput, setSearchInput] = useState<string>("");

  const allWords = useMemo(() => getAllWords(), []);

  const filteredWords = useMemo(() => {
    if (!searchInput.trim()) return allWords.slice(0, 30);
    const lower = searchInput.toLowerCase();
    return allWords.filter((w) =>
      w.word.toLowerCase().includes(lower)
    );
  }, [allWords, searchInput]);

  const associations = useMemo(() => {
    if (!selectedWord) return [];
    return getWordAssociations(selectedWord);
  }, [selectedWord]);

  const relatedWords = useMemo(() => {
    if (!selectedWord) return [];
    return getRelatedWords(selectedWord);
  }, [selectedWord]);

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
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
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
          <CardContent className="py-16 text-center text-muted-foreground">
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

// ─── Main Page ───────────────────────────────────────────────────

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("statistics");
  const [questionType, setQuestionType] = useState("banked_cloze");

  const selectedQt = cet4Data.question_types.find((qt) => qt.id === questionType);
  const hasData = questionType === "banked_cloze";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-gradient-to-r from-teal-50 via-emerald-50 to-amber-50 dark:from-teal-950/30 dark:via-emerald-950/30 dark:to-amber-950/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-teal-600 text-white">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                  CET4 词汇匹配标注检索系统
                </h1>
                <p className="text-sm text-muted-foreground">
                  Part III Section A 选词填空标注数据检索与分析
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <Database className="h-3.5 w-3.5 mr-1 text-teal-600" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {cet4Data.question_types.map((qt) => (
                    <SelectItem key={qt.id} value={qt.id}>
                      {qt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Badge variant="secondary" className="text-xs">
                📅 {cet4Data.metadata.exam_year}年{cet4Data.metadata.exam_month}月
              </Badge>
              <Badge variant="secondary" className="text-xs">
                📋 {cet4Data.metadata.total_sets}套题
              </Badge>
              <Badge variant="secondary" className="text-xs">
                📝 {getAllBlanks().length}空
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
        {!hasData ? (
          <Card className="py-20">
            <CardContent className="text-center space-y-4">
              <Database className="h-16 w-16 mx-auto text-teal-300" />
              <h2 className="text-xl font-semibold text-foreground">{selectedQt?.label}</h2>
              <p className="text-muted-foreground max-w-md mx-auto">
                {selectedQt?.description}
              </p>
              <p className="text-sm text-teal-600 bg-teal-50 dark:bg-teal-950/50 rounded-lg px-4 py-2 inline-block">
                该题型数据尚未录入，敬请期待
              </p>
            </CardContent>
          </Card>
        ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-6">
            <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1.5 rounded-xl">
              <TabsTrigger
                value="statistics"
                className="flex-1 min-w-[120px] data-[state=active]:bg-teal-600 data-[state=active]:text-white"
              >
                <BarChart3 className="h-4 w-4 mr-1.5" />
                统计概览
              </TabsTrigger>
              <TabsTrigger
                value="knowledge"
                className="flex-1 min-w-[120px] data-[state=active]:bg-teal-600 data-[state=active]:text-white"
              >
                <Search className="h-4 w-4 mr-1.5" />
                知识点检索
              </TabsTrigger>
              <TabsTrigger
                value="question"
                className="flex-1 min-w-[120px] data-[state=active]:bg-teal-600 data-[state=active]:text-white"
              >
                <FileText className="h-4 w-4 mr-1.5" />
                题目检索
              </TabsTrigger>
              <TabsTrigger
                value="fulltext"
                className="flex-1 min-w-[120px] data-[state=active]:bg-teal-600 data-[state=active]:text-white"
              >
                <BookOpen className="h-4 w-4 mr-1.5" />
                全文搜索
              </TabsTrigger>
              <TabsTrigger
                value="word"
                className="flex-1 min-w-[120px] data-[state=active]:bg-teal-600 data-[state=active]:text-white"
              >
                <Link2 className="h-4 w-4 mr-1.5" />
                单词关联
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="statistics">
            <StatisticsTab />
          </TabsContent>
          <TabsContent value="knowledge">
            <KnowledgePointSearchTab />
          </TabsContent>
          <TabsContent value="question">
            <QuestionSearchTab />
          </TabsContent>
          <TabsContent value="fulltext">
            <FullTextSearchTab />
          </TabsContent>
          <TabsContent value="word">
            <WordAssociationTab />
          </TabsContent>
        </Tabs>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-sm text-muted-foreground">
          数据来源：201506P3SA.json · 标注版本：v{cet4Data.metadata.annotation_version} · 题型扩展：5种CET4题型
        </div>
      </footer>
    </div>
  );
}
