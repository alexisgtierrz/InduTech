package com.indutech.api_inventario.entity;

import jakarta.persistence.*;

@Entity
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String sku;
    private double demanda;
    private double costo;

    public String getSku() { return sku; }
    public void setSku(String sku) { this.sku = sku; }
    public double getDemanda() { return demanda; }
    public void setDemanda(double demanda) { this.demanda = demanda; }
    public double getCosto() { return costo; }
    public void setCosto(double costo) { this.costo = costo; }
}