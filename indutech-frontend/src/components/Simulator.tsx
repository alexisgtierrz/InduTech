import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

interface Props {
  params: any;
  setParams: any;
  resultados: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  inventarioABC: any[];
}

type TipoEscenario = 'pedidos' | 'servicio' | 'entrega';
type SubTab = 'epq' | 'rop' | 'escenarios';
type UnidadTiempo = 'anual' | 'diaria';

export const Simulator = ({ params, setParams, resultados, handleChange, inventarioABC }: Props) => {

  const [origenDemanda, setOrigenDemanda] = useState<'manual' | 'abc'>('manual');
  const [skuSeleccionado, setSkuSeleccionado] = useState<string>('');
  const [escenarioVista, setEscenarioVista] = useState<TipoEscenario>('pedidos');
  const [subTab, setSubTab] = useState<SubTab>('epq');
  const [unidadTiempo, setUnidadTiempo] = useState<UnidadTiempo>('anual');

  const diasOperativos = Number(params.diasOperativos) > 0 ? Number(params.diasOperativos) : 1;
  const usaUnidadDiaria = unidadTiempo === 'diaria';
  const periodoLabel = usaUnidadDiaria ? 'día' : 'año';

  const mostrarValorPeriodo = (valorAnual: any, decimales = 2) => {
    const numero = Number(valorAnual);
    if (!Number.isFinite(numero)) return '-';
    const valor = usaUnidadDiaria ? numero / diasOperativos : numero;
    return Number.isInteger(valor) ? valor.toString() : valor.toFixed(decimales).replace(/\.?0+$/, '');
  };

  const valorInputPeriodo = (valorAnual: number) => {
    if (!Number.isFinite(Number(valorAnual))) return 0;
    const valor = usaUnidadDiaria ? valorAnual / diasOperativos : valorAnual;
    return Number(valor.toFixed(4));
  };

  const handlePeriodoChange = (name: string, value: number) => {
    if (!Number.isFinite(value)) value = 0;
    setParams((prev: any) => ({
      ...prev,
      [name]: usaUnidadDiaria ? value * diasOperativos : value
    }));
  };

  // --- Datos para el gráfico EPQ (curva de inventario tipo "trapecio" en 2 ciclos) ---
  const datosEPQ = useMemo(() => {
    const t1 = resultados.tiempoProduccionDias;
    const T = resultados.tiempoCicloDias;
    const imax = resultados.inventarioMaximo;

    if (!T || T <= 0) return [];

    const ciclos = 2;
    const data: { dia: number; nivel: number; fase: string }[] = [];

    for (let c = 0; c < ciclos; c++) {
      const base = c * T;
      if (c === 0) {
        data.push({ dia: base, nivel: 0, fase: 'Inicio de producción' });
      }
      data.push({ dia: base + t1, nivel: imax, fase: 'Fin de producción / Inicio de consumo' });
      data.push({ dia: base + T, nivel: 0, fase: 'Stock agotado' });
    }
    return data;
  }, [resultados.tiempoProduccionDias, resultados.tiempoCicloDias, resultados.inventarioMaximo]);

  // --- Datos para el gráfico de Punto de Reorden (agotamiento lineal de inventario) ---
  const { datosROP, diaPedido } = useMemo(() => {
    const T = resultados.tiempoCicloDias;
    const imax = resultados.inventarioMaximo;
    const rop = resultados.puntoReorden;
    const demandaDiaria = params.diasOperativos > 0 ? params.demandaAnual / params.diasOperativos : 0;

    if (!T || T <= 0 || demandaDiaria <= 0) return { datosROP: [], diaPedido: 0 };

    const puntos = 30;
    const data: { dia: number; nivel: number }[] = [];
    for (let i = 0; i <= puntos; i++) {
      const dia = (T * i) / puntos;
      const nivel = Math.max(imax - demandaDiaria * dia, 0);
      data.push({ dia: Number(dia.toFixed(2)), nivel: Number(nivel.toFixed(2)) });
    }

    const diaParaPedir = demandaDiaria > 0 ? (imax - rop) / demandaDiaria : 0;

    return { datosROP: data, diaPedido: Number(diaParaPedir.toFixed(2)) };
  }, [resultados, params.demandaAnual, params.diasOperativos]);

  const handleToggleOrigen = (origen: 'manual' | 'abc') => {
    setOrigenDemanda(origen);
    if (origen === 'abc' && skuSeleccionado) {
      const producto = inventarioABC.find(item => item.sku === skuSeleccionado);
      if (producto) setParams((prev: any) => ({ ...prev, demandaAnual: producto.demanda }));
    }
  };

  const handleSelectSKU = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const sku = e.target.value;
    setSkuSeleccionado(sku);
    const producto = inventarioABC.find(item => item.sku === sku);
    if (producto) {
      setParams((prev: any) => ({ ...prev, demandaAnual: producto.demanda }));
    }
  };

  // --- Escenario seleccionado para comparación ---
  const escenarioConfig: Record<TipoEscenario, {
    titulo: string;
    actual: any;
    comparacion: any;
    labelActual: string;
    labelComparacion: string;
    inputName: string;
    inputValue: number;
    inputLabel: string;
    explicacion: string;
  }> = {
    pedidos: {
      titulo: `Pedidos por ${periodoLabel}`,
      actual: resultados.escenarioActual,
      comparacion: resultados.escenarioComparacion,
      labelActual: `Actual (EPQ óptimo)`,
      labelComparacion: `Alternativo`,
      inputName: 'pedidosComparacion',
      inputValue: valorInputPeriodo(params.pedidosComparacion),
      inputLabel: `N° de pedidos por ${periodoLabel}`,
      explicacion: resultados.escenarioComparacion?.vecesSinStockEsperadasAnio < resultados.escenarioActual?.vecesSinStockEsperadasAnio
        ? `Pasar a ${mostrarValorPeriodo(params.pedidosComparacion)} pedido(s) por ${periodoLabel} reduciría el riesgo esperado de quedarse sin stock, ya que hay menos ciclos de pedido, aunque cada pedido sería de un lote mayor y elevaría el costo de mantenimiento.`
        : `Pasar a ${mostrarValorPeriodo(params.pedidosComparacion)} pedido(s) por ${periodoLabel} aumentaría el riesgo esperado de quedarse sin stock, ya que se compara contra un número similar o mayor de ciclos riesgosos.`,
    },
    servicio: {
      titulo: 'Nivel de servicio',
      actual: resultados.escenarioRiesgoActual,
      comparacion: resultados.escenarioServicioComparacion,
      labelActual: `Actual (${params.nivelServicio}%)`,
      labelComparacion: `Alternativo (${params.nivelServicioComparacion}%)`,
      inputName: 'nivelServicioComparacion',
      inputValue: params.nivelServicioComparacion,
      inputLabel: 'Nivel de servicio alternativo (%)',
      explicacion: params.nivelServicioComparacion < params.nivelServicio
        ? `Bajar el nivel de servicio a ${params.nivelServicioComparacion}% reduce el stock de seguridad y el ROP necesarios, pero aumenta la probabilidad y el volumen esperado de faltantes por ciclo.`
        : `Subir el nivel de servicio a ${params.nivelServicioComparacion}% exige más stock de seguridad y un ROP más alto, pero reduce el riesgo de quedarse sin stock.`,
    },
    entrega: {
      titulo: 'Días de entrega',
      actual: resultados.escenarioRiesgoActual,
      comparacion: resultados.escenarioEntregaComparacion,
      labelActual: `Actual (${params.tiempoEntrega} días)`,
      labelComparacion: `Alternativo (${params.tiempoEntregaComparacion} días)`,
      inputName: 'tiempoEntregaComparacion',
      inputValue: params.tiempoEntregaComparacion,
      inputLabel: 'Tiempo de entrega alternativo (días)',
      explicacion: params.tiempoEntregaComparacion < params.tiempoEntrega
        ? `Reducir el tiempo de entrega a ${params.tiempoEntregaComparacion} días disminuye la incertidumbre durante el lead time, bajando el stock de seguridad y el ROP necesarios.`
        : `Aumentar el tiempo de entrega a ${params.tiempoEntregaComparacion} días eleva la incertidumbre durante el lead time, por lo que se necesita más stock de seguridad y un ROP más alto.`,
    },
  };

  const escenario = escenarioConfig[escenarioVista];

  const subTabs: { id: SubTab; label: string }[] = [
    { id: 'epq', label: 'EPQ' },
    { id: 'rop', label: 'ROP' },
    { id: 'escenarios', label: 'Escenarios de Cambio' },
  ];

  return (
    <div className="simulador-container full-width">

      <div className="panel global-params">
        <h2>Parámetros Globales</h2>

        <div className="origen-toggle">
          <span className="origen-toggle-label">Demanda anual desde:</span>
          <div className="toggle-switch">
            <button
              type="button"
              className={origenDemanda === 'manual' ? 'toggle-option active' : 'toggle-option'}
              onClick={() => handleToggleOrigen('manual')}
            >
              Manual
            </button>
            <button
              type="button"
              className={origenDemanda === 'abc' ? 'toggle-option active' : 'toggle-option'}
              onClick={() => handleToggleOrigen('abc')}
            >
              Producto ABC
            </button>
          </div>
        </div>

        <div className="origen-toggle">
          <span className="origen-toggle-label">Unidades:</span>
          <div className="toggle-switch">
            <button
              type="button"
              className={unidadTiempo === 'anual' ? 'toggle-option active' : 'toggle-option'}
              onClick={() => setUnidadTiempo('anual')}
            >
              Por año
            </button>
            <button
              type="button"
              className={unidadTiempo === 'diaria' ? 'toggle-option active' : 'toggle-option'}
              onClick={() => setUnidadTiempo('diaria')}
            >
              Por día
            </button>
          </div>
        </div>

        <div className="inputs-row">
          {origenDemanda === 'manual' ? (
            <div className="input-group">
              <label>Demanda por {periodoLabel} (D):</label>
              <input
                type="number"
                name="demandaAnual"
                value={valorInputPeriodo(params.demandaAnual)}
                onChange={(e) => handlePeriodoChange('demandaAnual', parseFloat(e.target.value))}
              />
            </div>
          ) : (
            <div className="input-group">
              <label>Producto (SKU):</label>
              <select value={skuSeleccionado} onChange={handleSelectSKU}>
                <option value="" disabled>Elegí un producto…</option>
                {inventarioABC.map(item => (
                  <option key={item.sku} value={item.sku}>
                    SKU {item.sku} - Clase {item.clase} - Demanda: {mostrarValorPeriodo(item.demanda)} / {periodoLabel}
                  </option>
                ))}
              </select>
              {inventarioABC.length === 0 && (
                <small>No hay productos cargados en la pestaña ABC todavía.</small>
              )}
            </div>
          )}
          <div className="input-group">
            <label>Días Operativos:</label>
            <input type="number" name="diasOperativos" value={params.diasOperativos} onChange={handleChange} />
          </div>
        </div>
      </div>

      <div className="sub-tabs">
        {subTabs.map(t => (
          <button
            key={t.id}
            type="button"
            className={subTab === t.id ? 'sub-tab active' : 'sub-tab'}
            onClick={() => setSubTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {subTab === 'epq' && (
        <div className="sub-tab-content">
          <div className="panel sim-module module-epq full-width">
            <h3 className="module-title">Modelo de Producción (EPQ)</h3>
            <div className="module-inputs">
              <div className="input-group">
                <label>Tasa de Producción por {periodoLabel} (p):</label>
                <input
                  type="number"
                  name="tasaProduccion"
                  value={valorInputPeriodo(params.tasaProduccion)}
                  onChange={(e) => handlePeriodoChange('tasaProduccion', parseFloat(e.target.value))}
                />
              </div>
              <div className="input-row-half">
                <div className="input-group">
                  <label>Costo Prep. (Co):</label>
                  <input type="number" name="costoPreparacion" value={params.costoPreparacion} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Costo Mant. (Ch):</label>
                  <input type="number" name="costoMantenimiento" value={params.costoMantenimiento} onChange={handleChange} />
                </div>
              </div>
            </div>

            <div className="mini-cards-grid">
              <div className="mini-card card-neutral"><h4>{resultados.loteOptimoEPQ}</h4><p>Lote Óptimo (Q*)</p></div>
              <div className="mini-card card-neutral"><h4>{resultados.inventarioMaximo}</h4><p>Inventario Máximo (Imax)</p></div>
              <div className="mini-card card-neutral"><h4>{resultados.tiempoCicloDias} días</h4><p>T (días)</p></div>
              <div className="mini-card card-neutral"><h4>{resultados.tiempoProduccionDias} días</h4><p>Tiempo de Prod. (t1)</p></div>
            </div>
          </div>

          <div className="panel full-width chart-panel">
            <h3 className="module-title">Evolución del Inventario — Modelo EPQ</h3>
            <p className="chart-subtitle">
              Durante <strong>{resultados.tiempoProduccionDias} días</strong> se produce y consume a la vez (el inventario sube),
              luego durante <strong>{resultados.tiempoCicloDias - resultados.tiempoProduccionDias} días</strong> solo se consume
              (el inventario baja) hasta agotarse, reiniciando el ciclo.
            </p>
            <div style={{ height: '380px', width: '100%' }}>
              <ResponsiveContainer>
                <AreaChart data={datosEPQ} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                  <XAxis
                    dataKey="dia"
                    tick={{ fill: 'var(--text-soft)', fontSize: 12 }}
                    label={{ value: 'Días', position: 'insideBottom', offset: -10, fill: 'var(--text-soft)' }}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-soft)', fontSize: 12 }}
                    label={{ value: 'Unidades en inventario', angle: -90, position: 'insideLeft', fill: 'var(--text-soft)' }}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value} u.`, 'Inventario']}
                    labelFormatter={(label) => `Día ${label}`}
                    contentStyle={{ 
                      backgroundColor: 'var(--surface)', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border-soft)', 
                      boxShadow: 'var(--shadow)' 
                    }}
                  />
                  <ReferenceLine
                    y={resultados.inventarioMaximo}
                    stroke="var(--pareto-b)"
                    strokeDasharray="4 4"
                    label={{ position: 'insideTopLeft', value: `Imax = ${resultados.inventarioMaximo}`, fill: 'var(--text-soft)', fontSize: 11, fontWeight: '600' }}
                  />
                  <Area
                    type="linear"
                    dataKey="nivel"
                    name="Inventario"
                    stroke="var(--text-soft)"
                    fill="var(--pareto-b-soft)"
                    strokeWidth={2}
                    dot={{ r: 2, fill: 'var(--surface)', stroke: 'var(--text-soft)' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {subTab === 'rop' && (
        <div className="sub-tab-content">
          <div className="panel sim-module module-rop full-width">
            <h3 className="module-title">Gestión de Riesgos (ROP)</h3>
            <div className="module-inputs">
              <div className="input-group">
                <label>Nivel de Servicio (%):</label>
                <input
                  type="number"
                  name="nivelServicio"
                  min="50"
                  max="99.9"
                  step="0.1"
                  value={params.nivelServicio}
                  onChange={handleChange}
                />
              </div>
              <div className="input-row-half">
                <div className="input-group">
                  <label>Tiempo Entrega (L):</label>
                  <input type="number" name="tiempoEntrega" value={params.tiempoEntrega} onChange={handleChange} />
                </div>
                <div className="input-group">
                  <label>Desviación Demanda (σd):</label>
                  <input type="number" name="desviacion" value={params.desviacion} onChange={handleChange} />
                </div>
              </div>
            </div>
            <div className="mini-cards-grid grid-2-cols">
              <div className="mini-card card-neutral"><h4>{resultados.puntoReorden}</h4><p>Punto de Reorden (ROP)</p></div>
              <div className="mini-card card-neutral"><h4>{resultados.inventarioSeguridad}</h4><p>Inventario Seguridad (SS)</p></div>
            </div>
          </div>

          <div className="panel full-width chart-panel">
            <h3 className="module-title">Evolución del Inventario — Punto de Reorden (ROP)</h3>
            <p className="chart-subtitle">
              El inventario se agota a un ritmo constante. Al llegar al día <strong>{diaPedido}</strong> se alcanza el{' '}
              <strong>Punto de Reorden ({resultados.puntoReorden} u.)</strong> y debe lanzarse el pedido; durante el tiempo de
              entrega ({params.tiempoEntrega} días) el inventario sigue bajando hasta el{' '}
              <strong>Stock de Seguridad ({resultados.inventarioSeguridad} u.)</strong>, que actúa como colchón ante variaciones de demanda.
            </p>
            <div style={{ height: '380px', width: '100%' }}>
              <ResponsiveContainer>
                <LineChart data={datosROP} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} vertical={false} />
                  <XAxis
                    dataKey="dia"
                    tick={{ fill: 'var(--text-soft)', fontSize: 12 }}
                    label={{ value: 'Días', position: 'insideBottom', offset: -10, fill: 'var(--text-soft)' }}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-soft)', fontSize: 12 }}
                    label={{ value: 'Unidades en inventario', angle: -90, position: 'insideLeft', fill: 'var(--text-soft)' }}
                  />
                  <Tooltip
                    formatter={(value: any) => [`${value} u.`, 'Inventario']}
                    labelFormatter={(label) => `Día ${label}`}
                    contentStyle={{ 
                      backgroundColor: 'var(--surface)', 
                      borderRadius: '8px', 
                      border: '1px solid var(--border-soft)', 
                      boxShadow: 'var(--shadow)' 
                    }}
                  />
                  <ReferenceLine
                    y={resultados.puntoReorden}
                    stroke="var(--pareto-c)"
                    strokeDasharray="4 4"
                    label={{ position: 'insideTopLeft', value: `ROP = ${resultados.puntoReorden}`, fill: 'var(--text-soft)', fontSize: 11, fontWeight: '600' }}
                  />
                  <ReferenceLine
                    y={resultados.inventarioSeguridad}
                    stroke="var(--pareto-a)"
                    strokeDasharray="4 4"
                    label={{ position: 'insideBottomLeft', value: `SS = ${resultados.inventarioSeguridad}`, fill: 'var(--text-soft)', fontSize: 11, fontWeight: '600' }}
                  />
                  <ReferenceLine
                    x={diaPedido}
                    stroke="var(--pareto-line)"
                    strokeDasharray="3 3"
                    label={{ position: 'top', value: 'Pedido', fill: 'var(--text-soft)', fontSize: 11, fontWeight: '600' }}
                  />
                  <Line
                    type="linear"
                    dataKey="nivel"
                    name="Inventario"
                    stroke="var(--text)"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {subTab === 'escenarios' && (
  <div className="sub-tab-content">
    <div className="panel full-width chart-panel">
      <div className="comparativa-header">
        <h3 className="module-title" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
          Escenarios de Comparación
        </h3>
        <div className="escenario-selector">
          {(['pedidos', 'servicio', 'entrega'] as TipoEscenario[]).map(tipo => (
            <button
              key={tipo}
              type="button"
              className={escenarioVista === tipo ? 'toggle-option active' : 'toggle-option'}
              onClick={() => setEscenarioVista(tipo)}
            >
              {escenarioConfig[tipo].titulo}
            </button>
          ))}
        </div>
      </div>

      <p className="chart-subtitle">
        Con un nivel de servicio configurado de <strong>{params.nivelServicio}%</strong>, cada ciclo de pedido tiene una
        probabilidad de <strong>{(resultados.escenarioActual?.probabilidadFaltantePorCiclo * 100).toFixed(2)}%</strong> de
        quedarse sin stock...
      </p>

      <div className="comparativa-grid">
        {/* COLUNA IZQUIERDA: ACTUAL */}
        <div className="comparativa-col">
          <h4 className="comparativa-titulo">{escenario.labelActual}</h4>
          
          <div className="mini-cards-grid">
            <div className="mini-cards-row">
              <div className="mini-cards-cell">
                {escenarioVista === 'pedidos' ? (
                  <div className="mini-card">
                    <h4>{mostrarValorPeriodo(escenario.actual?.numeroPedidosAnual, 2)}</h4>
                    <p>Pedidos por {periodoLabel}</p>
                  </div>
                ) : (
                  <div className="mini-card">
                    <h4>{escenario.actual?.puntoReorden}</h4>
                    <p>Punto de Reorden (ROP)</p>
                  </div>
                )}
              </div>
              <div className="mini-cards-cell">
                {escenarioVista === 'pedidos' ? (
                  <div className="mini-card">
                    <h4>{escenario.actual?.loteOptimoPorPedido.toFixed(0)}</h4>
                    <p>Unidades por pedido</p>
                  </div>
                ) : (
                  <div className="mini-card">
                    <h4>{escenario.actual?.inventarioSeguridad}</h4>
                    <p>Stock de Seguridad (SS)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mini-cards-row">
              <div className="mini-cards-cell">
                <div className="mini-card">
                  <h4>{mostrarValorPeriodo(escenario.actual?.faltanteEsperadoAnual, 2)}</h4>
                  <p>Faltantes esperados / {periodoLabel}</p>
                </div>
              </div>
              <div className="mini-cards-cell">
                <div className="mini-card">
                  <h4>{mostrarValorPeriodo(escenario.actual?.vecesSinStockEsperadasAnio, 2)}</h4>
                  <p>Veces sin stock / {periodoLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DERECHA: ALTERNATIVO */}
        <div className="comparativa-col">
          <div className="comparativa-header">
            <h4 className="comparativa-titulo">{escenario.labelComparacion}</h4>
            <div className="input-pedidos-comparacion">
              <label>{escenario.inputLabel}:</label>
              <input
                type="number"
                name={escenario.inputName}
                step={escenario.inputName === 'pedidosComparacion' && usaUnidadDiaria ? '0.01' : '1'}
                value={escenario.inputValue}
                onChange={(e) => {
                  const value = parseFloat(e.target.value);
                  if (escenario.inputName === 'pedidosComparacion') {
                    handlePeriodoChange('pedidosComparacion', value);
                  } else {
                    handleChange(e);
                  }
                }}
              />
            </div>
          </div>
          
          <div className="mini-cards-grid">
            <div className="mini-cards-row">
              <div className="mini-cards-cell">
                {escenarioVista === 'pedidos' ? (
                  <div className="mini-card">
                    <h4>{mostrarValorPeriodo(escenario.comparacion?.numeroPedidosAnual, 2)}</h4>
                    <p>Pedidos por {periodoLabel}</p>
                  </div>
                ) : (
                  <div className="mini-card">
                    <h4>{escenario.comparacion?.puntoReorden}</h4>
                    <p>Punto de Reorden (ROP)</p>
                  </div>
                )}
              </div>
              <div className="mini-cards-cell">
                {escenarioVista === 'pedidos' ? (
                  <div className="mini-card">
                    <h4>{escenario.comparacion?.loteOptimoPorPedido.toFixed(0)}</h4>
                    <p>Unidades por pedido</p>
                  </div>
                ) : (
                  <div className="mini-card">
                    <h4>{escenario.comparacion?.inventarioSeguridad}</h4>
                    <p>Stock de Seguridad (SS)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mini-cards-row">
              <div className="mini-cards-cell">
                <div className="mini-card">
                  <h4>{mostrarValorPeriodo(escenario.comparacion?.faltanteEsperadoAnual, 2)}</h4>
                  <p>Faltantes esperados / {periodoLabel}</p>
                </div>
              </div>
              <div className="mini-cards-cell">
                <div className="mini-card">
                  <h4>{mostrarValorPeriodo(escenario.comparacion?.vecesSinStockEsperadasAnio, 2)}</h4>
                  <p>Veces sin stock / {periodoLabel}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="chart-subtitle" style={{ marginTop: '20px' }}>
        {escenario.explicacion}
      </p>
    </div>
  </div>
)}
    </div>
  );
};
